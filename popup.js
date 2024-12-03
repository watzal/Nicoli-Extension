document.addEventListener('DOMContentLoaded', function() {
    // Get screen elements
    const mainScreen = document.getElementById('main-screen');
    const summarizeScreen = document.getElementById('summarize-screen');
    const todoScreen = document.getElementById('todo-screen');
    const themeScreen = document.getElementById('theme-screen');
    const talkScreen = document.getElementById('talk-screen');


    const translatorScreen = document.getElementById('translator-screen');
    const translateButton = document.querySelector('.translate-button');
    const inputBoxT = document.querySelector('.input-box');
    const outputBox = document.querySelector('.output-box');
    const sourceLanguageSelect = document.getElementById('source-language');
    const targetLanguageSelect = document.getElementById('target-language');



    const buttons = document.querySelectorAll('.feature-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const getSummaryBtn = document.querySelector('.get-summary');
    const clearBtn = document.querySelector('.dustbin-icon');
    const textArea = document.getElementById('text-to-summarize');
    const wordCountDisplay = document.querySelector('.word-count');
    const questionsScreen = document.getElementById('questions-screen');


    const generateQueBtn = document.querySelector('.btn-generate');
    const questTextarea = document.getElementById('question-input');
    const questContainer = document.getElementById('question-cards');


   

    const timerScreen = document.getElementById('timer-screen');

    let [hours, minutes, seconds] = [0, 0, 0];
    let countdownMode = false;
    const display = document.getElementById('display');
    const alertBox = document.getElementById('alert');
    const alertButton = document.getElementById('alertButton');

    const summaryOutput = document.getElementById('summary-output');
    const modelStatus = document.getElementById('model-status');
    const downloadProgressBar = document.getElementById('download-progress-bar');
    let globalSummarizer = null;
    summaryOutput.classList.add('hidden'); 

    const inputBox = document.getElementById("input-box");
    const addTaskBtn = document.getElementById("add-task");
    const listContainer = document.getElementById("list-container");
  
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      const themeBackgrounds = {
          'nlights': './images/northern_lights.jpg',
          'cafe': './images/cafe.jpg',
          'beach': './images/beach.jpg',
          'forest': './images/forest.jpg',
          'flowers': './images/flowers.jpg',
          'fire': './images/fire.jpg'
      };

      const backgroundImage = themeBackgrounds[savedTheme];
      const backgroundElement = document.querySelector('.background');
      
      if (backgroundElement) {
          backgroundElement.style.backgroundImage = `url('${backgroundImage}')`;
      } else {

          const newBackgroundElement = document.createElement('div');
          newBackgroundElement.classList.add('background');
          newBackgroundElement.style.backgroundImage = `url('${backgroundImage}')`;
          document.body.appendChild(newBackgroundElement);
      }
  }
   

    async function generateQuestions() {
        const textToGenerateQuestions = questTextarea.value.trim();
        if (!textToGenerateQuestions) {
            alert("Please enter some text to generate questions!");
            return;
        }


        if (!('aiOriginTrial' in chrome && 'languageModel' in chrome.aiOriginTrial)) {
            alert("Prompt API is not supported in this browser.");

            return;
        }

        try {
            const session = await chrome.aiOriginTrial.languageModel.create({
                systemPrompt: "You are a helpful assistant generating relevant questions based on input text. I just want the questions and they should be seperated with a line",
            });


            const response = await session.prompt(
                `Based on the following text, generate a list of questions:\n\n${textToGenerateQuestions}`
            );

            console.log("API Response:", response);

            
            displayQuestions(response);

    
            session.destroy();
        } catch (error) {
            console.error("Error generating questions:", error);
            alert("An error occurred while generating the questions. Please try again.");
        }
    }

  
    function displayQuestions(response) {
        // Clear previous content
        questContainer.innerHTML = "";

    
        const lines = response.split("\n").filter((line) => line.trim() !== "");
        const questions = lines.map((line) => line.replace(/^\*|\d+\.\s*/g, "").trim()); // Clean up lines
    
        // Check if valid questions were generated
        if (questions.length === 0) {
            questContainer.innerHTML = `<p>No questions were generated. Please try again with different text.</p>`;
            return;
        }
    
        // Create and display cards for each question
        questions.forEach((question, index) => {
            const questionCard = document.createElement('div');
            questionCard.classList.add('question-card');
    
            const questionText = document.createElement('p');
            questionText.textContent = `${index + 1}. ${question}`;
            questionCard.appendChild(questionText);
    
            questContainer.appendChild(questionCard);
        });
    
        // Make the container visible
        questContainer.classList.remove('hidden');
    }

    // Add event listener for the Generate Questions button
    generateQueBtn.addEventListener('click', generateQuestions);

    

    

    //prompt api
    const textAreaPrompt = document.getElementById('talk-textarea');
    const goButton = document.getElementById('go-button');
    const responseContainer = document.getElementById('response-container');
    const responseText = document.getElementById('response-text');

     // Function to check Prompt API capabilities
     async function checkCapabilities() {
      try {
          const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
          if (capabilities.available === "readily") {
              return true;
          } else if (capabilities.available === "after-download") {
              console.log("Downloading the model...");
              await downloadModel();
              return true;
          } else {
              console.error("Prompt API not available.");
              return false;
          }
      } catch (error) {
          console.error("Error checking capabilities:", error);
          return false;
      }
  }
  // Download the Gemini Nano model
  async function downloadModel() {
    const session = await chrome.aiOriginTrial.languageModel.create({
        monitor(monitor) {
            monitor.addEventListener("downloadprogress", (e) => {
                console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
        },
    });
    session.destroy(); // Cleanup after download
}

// Function to initialize a language model session
async function createSession() {
    return await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: "You are a friendly assistant. Please answer queries clearly.",
    });
}

// Function to add a message bubble to the response container
function addMessageBubble(content, sender = "user") {
  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble', sender); // 'user' or 'assistant'
  bubble.textContent = content;
  responseContainer.appendChild(bubble);
  // responseContainer.scrollTop = responseContainer.scrollHeight; // Auto-scroll to the latest message
  bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
  // Save history in localStorage
  const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  chatHistory.push({ sender, content });
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

}

goButton.addEventListener('click', async () => {
  const userInput = textAreaPrompt.value.trim();
  if (!userInput) {
      // responseText.textContent = "Please enter a message.";
      console.log(userInput);
      return;
  }
  addMessageBubble(userInput, "user");
  textAreaPrompt.value = '';

  if (await checkCapabilities()) {
      try {
          const session = await createSession();
          const result = await session.prompt(userInput);
          console.log(`${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`);
          addMessageBubble(result, "assistant");
          session.destroy(); // Cleanup session
      } catch (error) {
          console.error("Error during prompt:", error);
          addMessageBubble("An error occurred. Please try again.", "assistant");

      }
  } else {
    console.log(`${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`);
    addMessageBubble("Prompt API is not available.", "assistant");
  }
});
    

const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(({ sender, content }) => {
      addMessageBubble(content, sender);
  });


    const displayTime = document.querySelector(".display-time");
    function showTime() {
      let time = new Date();
      displayTime.innerText = time.toLocaleTimeString("en-US", { hour12: false });
      setTimeout(showTime, 1000); // Update time every second
    }
    showTime();

    // Date Display
function updateDate() {
  let today = new Date();
  let dayName = today.getDay(),
    dayNum = today.getDate(),
    month = today.getMonth(),
    year = today.getFullYear();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const IDCollection = ["day", "daynum", "month", "year"];
  const val = [dayWeek[dayName], dayNum, months[month], year];

  for (let i = 0; i < IDCollection.length; i++) {
    document.getElementById(IDCollection[i]).firstChild.nodeValue = val[i];
  }
}

updateDate();

function updateWordCount() {
  const text = textArea.value.trim();
  const wordCount = text ? text.split(/\s+/).length : 0; // Count words
  wordCountDisplay.textContent = `${wordCount} words`;
}

// Attach event listener to the textarea
textArea.addEventListener('input', updateWordCount);

// Clear button functionality
clearBtn.addEventListener('click', () => {
  textArea.value = '';
  textArea.focus();
  updateWordCount();
  summaryOutput.classList.add("hidden"); // Reset word count
});


    
  
    // Show todo tasks on load
    showTask();
    
    

    // Add click event listeners to all main menu buttons
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        switch(this.id) {
          case 'summarize':
            mainScreen.classList.add('hidden');
            summarizeScreen.classList.remove('hidden');
            break;
          case 'todo':
            // console.log('todo clicked');
            mainScreen.classList.add('hidden');
            todoScreen.classList.remove('hidden');
            break;
          case 'translator':
            mainScreen.classList.add('hidden');
            translatorScreen.classList.remove('hidden');
            break;
          case 'questions':
            mainScreen.classList.add('hidden');
            questionsScreen.classList.remove('hidden');
            break;
          case 'talktome':
            mainScreen.classList.add('hidden');
            talkScreen.classList.remove('hidden');
            break;

          case 'timer':
            // console.log('timer clicked');
            mainScreen.classList.add('hidden');
            timerScreen.classList.remove('hidden');
            break;
        }
      });
    });
   




    // Back button functionality
    backBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        summarizeScreen.classList.add('hidden');
        todoScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        timerScreen.classList.add('hidden');
        questionsScreen.classList.add('hidden');
        themeScreen.classList.add('hidden');
        talkScreen.classList.add('hidden');
        translatorScreen.classList.add('hidden');
        inputBoxT.value = '';
        outputBox.value = '';
        textAreaPrompt.value = ''; // Clear input
            responseText.textContent = '';
            // if (responseText) responseText.textContent = ''; // Clear response
            responseContainer.style.display = "none";
        
        //resetting the summary screen
        textArea.value = ''; // Clear text area
        summaryOutput.textContent = ''; // Clear summary output
        summaryOutput.classList.add('hidden'); 
        wordCountDisplay.textContent = `0 words`;

        if (talkScreen.classList.contains('hidden')) {
          localStorage.removeItem('chatHistory'); // Clear chat history
      }
      });
    });

    textAreaPrompt.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); // Prevent line breaks
          goButton.click();   // Trigger the "Go" button click
      }
  });
  


    // Summarize functionality
    getSummaryBtn.addEventListener('click', () => {
      const text = textArea.value.trim();
      if (text) {
        console.log('Getting summary for:', text);
      } else {
        alert('Please enter some text to summarize');
      }
    });

    

    //code for summary generation
    // Feature detection and initialization
  async function initializeSummarizer() {
  // Check if Summarizer API is available
    if (!('ai' in self && 'summarizer' in self.ai)) {
        modelStatus.textContent = 'Summarizer API is not supported in this browser.';
        return null;
    }
  
    try {
        const capabilities = await self.ai.summarizer.capabilities();
        
        switch(capabilities.available) {
            case 'no':
                console.log('Summarizer API cannot be used due to system limitations.')
                // modelStatus.textContent = 'Summarizer API cannot be used due to system limitations.';
                return null;
            
            case 'after-download':
                console.log('Model needs to be downloaded...')
                // modelStatus.textContent = 'Model needs to be downloaded...';
                break;
            
            case 'readily':
                console.log('Summarizer API is ready to use.');
                // modelStatus.textContent = 'Summarizer API is ready to use.';
                break;
        }
        
        // Create summarizer with download monitoring
        const summarizer = await self.ai.summarizer.create({
            type: document.getElementById('summary-type').value,
            length: document.getElementById('summary-length').value,
            format: 'markdown',
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    const progressPercent = Math.round(e.loaded/e.total*100);
                    // modelStatus.textContent = `Downloading model: ${progressPercent}%`;
                    downloadProgressBar.style.width = `${progressPercent}%`;
                    
                    if (progressPercent === 100) {
                        console.log('Model download complete. Ready to summarize!');
                        
                        // modelStatus.textContent = 'Model download complete. Ready to summarize!';
                    }
                });
            }
        });
        
        // Store the summarizer globally
        globalSummarizer = summarizer;
        return summarizer;
    } catch (error) {
        console.log('error');
        // modelStatus.textContent = `Error initializing Summarizer: ${error.message}`;
        return null;
    }
  }

async function generateSummary() {
  const inputText = textArea.value;
  const summaryType = document.getElementById('summary-type').value;
  const summaryLength = document.getElementById('summary-length').value;
  
  if (!inputText.trim()) {
      summaryOutput.textContent = 'Please enter some text to summarize.';
      return;
  }


  
  try {
      // Use the global summarizer if already initialized
      let summarizer = globalSummarizer;
      if (!summarizer) {
          summarizer = await initializeSummarizer();
      }
      
      if (!summarizer) {
          summaryOutput.textContent = 'Failed to initialize summarizer.';
          return;
      }
      
      // Regenerate summarizer with current type and length
      summarizer = await self.ai.summarizer.create({
          type: summaryType,
          length: summaryLength,
          format: 'markdown'
      });
      
      // Generate summary
      const summary = await summarizer.summarize(inputText, {
          context: `Generating a ${summaryLength} ${summaryType} summary`
      });

      
      
      // summaryOutput.textContent = formattedSummary;
      summaryOutput.textContent = summary;
      summaryOutput.classList.remove('hidden');
  } catch (error) {
      summaryOutput.textContent = `Summarization error: ${error.message}`;
      console.error(error);
  } 
 
}
getSummaryBtn.addEventListener('click', generateSummary);
initializeSummarizer();
    clearBtn.addEventListener('click', () => {
      textArea.value = '';
      textArea.focus();
      updateWordCount();
  summaryOutput.classList.add("hidden");
    });


    //THEME functionality
    document.querySelectorAll('.theme-image-button').forEach(button => {
      button.addEventListener('click', () => {
        const theme = button.getAttribute('data-theme');
        
        // Define background images for each theme
        const themeBackgrounds = {
          'nlights': './images/northern_lights.jpg',
          'cafe': './images/cafe.jpg',
          'beach': './images/beach.jpg',
          'forest': './images/forest.jpg',
          'flowers': './images/flowers.jpg',
          'fire': './images/fire.jpg'
        };
    
        // Get the selected background image
        const backgroundImage = themeBackgrounds[theme];
        localStorage.setItem('selectedTheme', theme);
        const backgroundElement = document.querySelector('.background');
    if (backgroundElement) {
      backgroundElement.style.backgroundImage = `url('${backgroundImage}')`;
    } else {
      // If .background doesn't exist, create it
      const newBackgroundElement = document.createElement('div');
      newBackgroundElement.classList.add('background');
      newBackgroundElement.style.backgroundImage = `url('${backgroundImage}')`;
      document.body.appendChild(newBackgroundElement);
    }
        
      });
    });
   
    // Todo functionality
    function addTask() {
      if(inputBox.value === '') {
        alert("You must write something!");
      } else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        span.style.cursor = "pointer";
        li.appendChild(span);

        span.addEventListener("click", function () {
            li.remove();
            saveData(); // Update data after deletion
          });
        inputBox.value = '';
        saveData();
      }
    }
  
    addTaskBtn.addEventListener("click", addTask);
    
    inputBox.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        addTask();
      }
    });
  
    listContainer.addEventListener("click", (e) => {
      if(e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        saveData();
      } else if(e.target.tagName === "SPAN") {
        e.target.parentElement.remove();
        saveData();
      }
    });
  
    function saveData() {
      localStorage.setItem("todoData", listContainer.innerHTML);
    }
  
    function showTask() {
      const savedData = localStorage.getItem("todoData");
      if(savedData) {
        listContainer.innerHTML = savedData;
      }
    }


function updateDisplay() {
    display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    display.style.transform = 'scale(1.1)';
    setTimeout(() => {
        display.style.transform = 'scale(1)';
    }, 300);
}


document.querySelector('.leaf-icon').addEventListener('click', () => {
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('theme-screen').classList.remove('hidden');
});

document.querySelector('.timer-icon').addEventListener('click', () => {
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('timer-screen').classList.remove('hidden');
});
document.getElementById('start').addEventListener('click', () => {
    let hoursInput = parseInt(document.getElementById('hours').value) || 0;
    let minutesInput = parseInt(document.getElementById('minutes').value) || 0;
    let secondsInput = parseInt(document.getElementById('seconds').value) || 0;

    minutesInput += Math.floor(secondsInput / 60); // Add overflow seconds to minutes
    secondsInput = secondsInput % 60; // Remainder becomes the seconds

    hoursInput += Math.floor(minutesInput / 60); // Add overflow minutes to hours
    minutesInput = minutesInput % 60;

    if (countdownMode && (hoursInput > 0 || minutesInput > 0 || secondsInput > 0)) {
        chrome.runtime.sendMessage({
            type: 'START_TIMER',
            options: {
                countdownMode: true,
                hours: hoursInput,
                minutes: minutesInput,
                seconds: secondsInput
            }
        });
    } else if (!countdownMode) {
        chrome.runtime.sendMessage({
            type: 'START_TIMER'
        });
    }
});
  


document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({
        type: 'STOP_TIMER'
    });
});
  


document.getElementById('reset').addEventListener('click', () => {
    chrome.runtime.sendMessage({
        type: 'RESET_TIMER'
    });
});
  


document.getElementById('countdown').addEventListener('click', () => {
    let hoursInput = parseInt(document.getElementById('hours').value) || 0;
    let minutesInput = parseInt(document.getElementById('minutes').value) || 0;
    let secondsInput = parseInt(document.getElementById('seconds').value) || 0;
    minutesInput += Math.floor(secondsInput / 60); // Add overflow seconds to minutes
    secondsInput = secondsInput % 60; // Remainder becomes the seconds

    hoursInput += Math.floor(minutesInput / 60); // Add overflow minutes to hours
    minutesInput = minutesInput % 60;
    countdownMode = true;
    chrome.runtime.sendMessage({
        type: 'START_TIMER',
        options: {
            countdownMode: true,
            hours: hoursInput,
            minutes: minutesInput,
            seconds: secondsInput
        }
    });
});

// popup.js



  
  
chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'TIMER_UPDATE':
            hours = message.hours;
            minutes = message.minutes;
            seconds = message.seconds;
            isRunning = message.isRunning;
            updateDisplay();
            break;
        case 'TIMER_RESET':
            [hours, minutes, seconds] = [0, 0, 0];
            isRunning = false;
            countdownMode = false;
            updateDisplay();
            break;
    }
});
  

alertButton.addEventListener('click', () => {
    alertBox.classList.add('hidden');
    chrome.runtime.sendMessage({
        type: 'RESET_TIMER'
    });
});
  // Initialize the display
  updateDisplay();

  document.querySelector('.exchange-icon').addEventListener('click', () => {
    const tempLanguage = sourceLanguageSelect.value;
    sourceLanguageSelect.value = targetLanguageSelect.value;
    targetLanguageSelect.value = tempLanguage;
});

  translateButton.addEventListener('click', async function () {
    console.log("i am clicked");
      const textToTranslate = inputBoxT.value.trim();
      console.log(textAreaPrompt); // Input text from the input box
      const sourceLanguage = sourceLanguageSelect.value; // Source language selected
      const targetLanguage = targetLanguageSelect.value; // Target language selected
  
      // Clear the output box before starting the translation
      outputBox.value = '';
  
      if (!textToTranslate) {
          outputBox.value = "Please enter some text to translate."; // If no text is entered
          return;
      }
  
      try {
          // Check if the Translator API is supported
          if ('translation' in self && 'createTranslator' in self.translation) {
              // Check if translation is possible for the selected language pair
              const canTranslate = await self.translation.canTranslate({
                  sourceLanguage,
                  targetLanguage,
              });
  
              if (canTranslate === 'readily' || canTranslate === 'after-download') {
                  // Create the translator instance
                  const translator = await self.translation.createTranslator({
                      sourceLanguage,
                      targetLanguage,
                  });
  
                  // Handle download progress if needed
                  if (canTranslate === 'after-download') {
                      translator.ondownloadprogress = (progressEvent) => {
                          outputBox.value = `Downloading: ${progressEvent.loaded}/${progressEvent.total}`;
                      };
                      await translator.ready; // Wait until the download completes
                  }
  
                  // Perform the translation
                  const translatedText = await translator.translate(textToTranslate);
                  outputBox.value = translatedText; // Display the translated text
              } else {
                  outputBox.value = "Translation is not available for this language pair."; // If language pair is not supported
              }
          } else {
              outputBox.value = "The Translator API is not supported in this browser."; // If API is not supported
          }
      } catch (error) {
          console.error('Error during translation:', error);
          outputBox.value = "An error occurred. Please try again."; // Display error message
      }
  });
 
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "load-transcript") {
        const inputBoxT = document.querySelector('.input-box'); // Translator input box
        if (inputBoxT) {
            inputBoxT.value = message.transcript; // Set transcript in the input box
            console.log("Transcript loaded into input box:", message.transcript);
        }
    }
});

// Automatically load the stored transcript when the popup opens
chrome.storage.local.get("transcript", ({ transcript }) => {
    if (transcript) {
        const inputBoxT = document.querySelector('.input-box');
        if (inputBoxT) {
            inputBoxT.value = transcript;
            console.log("Transcript preloaded from storage:", transcript);
        }
    }
});


  });
