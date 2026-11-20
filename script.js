// Add an event listener to the form that runs when the form is submitted
document.getElementById('routineForm').addEventListener('submit', async (e) => {
  // Prevent the form from refreshing the page
  e.preventDefault();
  
  // Get values from all inputs and store them in variables
  const timeOfDay = document.getElementById('timeOfDay').value;
  const focusArea = document.getElementById('focusArea').value;
  const timeAvailable = document.getElementById('timeAvailable').value;
  const energyLevel = document.getElementById('energyLevel').value;

  // Get all checked activity checkboxes and turn them into a comma-separated list
  const checkedBoxes = document.querySelectorAll('input[name="activities"]:checked');
  const activities = [];
  for (const box of checkedBoxes) {
    activities.push(box.value);
  }
  const activitiesList = activities.join(', ');

  // Save the user's choices so they are still there next time (Prompt 2)
  savePreferences(timeOfDay, focusArea, timeAvailable, energyLevel, activities);

  
  // Find the submit button and update its appearance to show loading state
  const button = document.querySelector('button[type="submit"]');
  button.textContent = 'Generating...';
  button.disabled = true;
  
  try {    
    // Make the API call to OpenAI's chat completions endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [      
          { role: 'system', content: `You are a helpful assistant that creates quick, focused daily routines. Always keep routines short, realistic, and tailored to the user's preferences.` },
          { role: 'user', content: `Please create a personalized daily routine for me with these preferences:
- Time of day: ${timeOfDay}
- Focus area: ${focusArea}
- Time available: ${timeAvailable} minutes
- Energy level: ${energyLevel}
- Preferred activities: ${activitiesList || 'No preference'}

Give me a structured, step-by-step routine that fits these parameters.` }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      })
    });
    
    // Convert API response to JSON and get the generated routine
    const data = await response.json();
    const routine = data.choices[0].message.content;
    
    // Show the result section and display the routine
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('routineOutput').textContent = routine;
    
  } catch (error) {
    // If anything goes wrong, log the error and show user-friendly message
    console.error('Error:', error);
    document.getElementById('routineOutput').textContent = 'Sorry, there was an error generating your routine. Please try again.';
  } finally {
    // Always reset the button back to its original state using innerHTML to render the icon
    button.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate My Routine';
    button.disabled = false;
  }
});

// Save the user's routine preferences to localStorage so they persist between visits
function savePreferences(timeOfDay, focusArea, timeAvailable, energyLevel, activities) {
  // Put all the preferences into one object
  const preferences = {
    timeOfDay: timeOfDay,
    focusArea: focusArea,
    timeAvailable: timeAvailable,
    energyLevel: energyLevel,
    activities: activities
  };

  // localStorage can only store text, so we convert the object to a JSON string
  localStorage.setItem('routinePreferences', JSON.stringify(preferences));
}

// Load saved preferences (if any) and fill in the form with them
function loadPreferences() {
  // Get the saved JSON string from localStorage
  const saved = localStorage.getItem('routinePreferences');

  // If nothing was saved yet, do nothing
  if (!saved) {
    return;
  }

  // Convert the JSON string back into an object
  const preferences = JSON.parse(saved);

  // Fill in the dropdowns with the saved values
  document.getElementById('timeOfDay').value = preferences.timeOfDay;
  document.getElementById('focusArea').value = preferences.focusArea;
  document.getElementById('timeAvailable').value = preferences.timeAvailable;
  document.getElementById('energyLevel').value = preferences.energyLevel;

  // Re-check the saved activity checkboxes
  const checkboxes = document.querySelectorAll('input[name="activities"]');
  for (const box of checkboxes) {
    box.checked = preferences.activities.includes(box.value);
  }
}

// Load any saved preferences as soon as the page opens
loadPreferences();
