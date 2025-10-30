import { ClassArrangementInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ArrangementResponse {
  success: boolean;
  data?: ClassArrangementInfo | ClassArrangementInfo[];
  error?: string;
}

// Fetch all arrangements
export async function fetchAllArrangements(): Promise<ClassArrangementInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}`);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
    }

    const result: ArrangementResponse = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch arrangements');
  } catch (error) {
    console.error('Error fetching arrangements:', error);
    throw error;
  }
}

// Create a new arrangement
export async function createArrangement(
  arrangement: ClassArrangementInfo
): Promise<ClassArrangementInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arrangement),
    });

    const result: ArrangementResponse = await response.json();

    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to create arrangement');
  } catch (error) {
    console.error('Error creating arrangement:', error);
    throw error;
  }
}

// Update an existing arrangement
export async function updateArrangement(
  arrangement: ClassArrangementInfo
): Promise<ClassArrangementInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arrangement),
    });

    const result: ArrangementResponse = await response.json();

    if (result.success && result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to update arrangement');
  } catch (error) {
    console.error('Error updating arrangement:', error);
    throw error;
  }
}

// Delete an arrangement
export async function deleteArrangement(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });

    const result: ArrangementResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete arrangement');
    }
  } catch (error) {
    console.error('Error deleting arrangement:', error);
    throw error;
  }
}

// Download arrangements as JSON file
export async function downloadArrangementsAsJSON(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}?export=true`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunday-school-arrangements-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading arrangements:', error);
    throw error;
  }
}

// Upload/Import arrangements from JSON file
export async function uploadArrangementsFromFile(file: File): Promise<ClassArrangementInfo[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const arrangements = JSON.parse(content) as ClassArrangementInfo[];

        // Upload each arrangement to the database
        const uploadedArrangements: ClassArrangementInfo[] = [];
        for (const arrangement of arrangements) {
          const uploaded = await createArrangement(arrangement);
          uploadedArrangements.push(uploaded);
        }

        resolve(uploadedArrangements);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
