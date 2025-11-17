// Data Import/Export utilities

/**
 * Export application state to JSON file
 * @param {Object} state - Application state to export
 * @param {string} filename - Optional filename for the download
 */
export function exportToJSON(state, filename = 'cc-tracker-backup.json') {
  try {
    // Create a clean copy of state without transient data
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      theme: state.theme,
      cards: state.cards,
      entries: state.entries
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to export data:', error);
    return false;
  }
}

/**
 * Import application state from JSON file
 * @returns {Promise<Object|null>} - Returns parsed state or null if cancelled/failed
 */
export function importFromJSON() {
  return new Promise((resolve, reject) => {
    try {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null); // User cancelled
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate imported data structure
          if (!validateImportedData(data)) {
            reject(new Error('Invalid data format. Please select a valid backup file.'));
            return;
          }

          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse JSON file: ' + error.message));
        }
      };

      input.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Trigger file picker
      input.click();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validate imported data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} - True if valid
 */
function validateImportedData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  if (!Array.isArray(data.cards) || !Array.isArray(data.entries)) {
    return false;
  }

  // Validate cards structure
  for (const card of data.cards) {
    if (!card.id || !card.name || typeof card.limit !== 'number' || typeof card.apr !== 'number') {
      return false;
    }
  }

  // Validate entries structure
  for (const entry of data.entries) {
    if (!entry.id || !entry.cardId || !entry.date || typeof entry.currentBalance !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Merge imported data with existing state
 * @param {Object} currentState - Current application state
 * @param {Object} importedData - Imported data from JSON
 * @param {string} mode - 'replace' or 'merge'
 * @returns {Object} - New merged state
 */
export function mergeImportedData(currentState, importedData, mode = 'replace') {
  if (mode === 'replace') {
    // Replace all data
    return {
      ...currentState,
      theme: importedData.theme || currentState.theme,
      cards: importedData.cards,
      entries: importedData.entries,
      selectedCardId: importedData.cards.length > 0 ? importedData.cards[0].id : null,
      draft: currentState.draft // Keep current draft
    };
  } else {
    // Merge mode - combine cards and entries
    const existingCardIds = new Set(currentState.cards.map(c => c.id));
    const newCards = importedData.cards.filter(c => !existingCardIds.has(c.id));

    const existingEntryIds = new Set(currentState.entries.map(e => e.id));
    const newEntries = importedData.entries.filter(e => !existingEntryIds.has(e.id));

    return {
      ...currentState,
      cards: [...currentState.cards, ...newCards],
      entries: [...currentState.entries, ...newEntries]
    };
  }
}
