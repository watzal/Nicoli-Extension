document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const contentId = tab.dataset.tab;  
    document.getElementById(contentId).classList.add('active');
  });
});

let interviewSession;
let profileData = {};


function activateMockInterviewTab() {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));

  const mockInterviewTab = document.querySelector('.tab[data-tab="mock-interview"]');
  const mockInterviewContent = document.getElementById('mock-interview');

  mockInterviewTab.classList.add('active');
  mockInterviewContent.classList.add('active');
}

function activateCodeExplanationTab() {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));

  const codeExplanationTab = document.querySelector('.tab[data-tab="code-explanation"]');
  const codeExplanationContent = document.getElementById('code-explanation');

  codeExplanationTab.classList.add('active');
  codeExplanationContent.classList.add('active');
}


chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "START_MOCK_INTERVIEW") {
    activateMockInterviewTab();
    startMockInterview(message.data);


  } else {
    activateCodeExplanationTab();
    chrome.storage.session.get('lastCodeToExplain', ({ lastCodeToExplain }) => {
      chromeAIExplainCode(lastCodeToExplain);
    });
  }
});




async function startMockInterview(profileData) {
  const conversation = document.getElementById('interview-conversation');
  conversation.innerHTML = ''; 

  try {
      interviewSession = await chrome.aiOriginTrial.languageModel.create({
          systemPrompt: `You are an interviewer conducting a mock interview based on the candidate's LinkedIn profile. Your name is Mrs. Parker, remember to introduce yourself well and ask the user for the dream company and the preferred job profile then on the basis of the user input, Ask questions related to their experience, skills, and goals.`
      });

      const profileSummary = `
      Name: ${profileData.person.firstName} ${profileData.person.lastName}
      Occupation: ${profileData.person.headline}
      Skills: ${profileData.person.skills.join(', ')}
      Summary: ${profileData.person.summary}
      
    `;
      const openingQuestion = await interviewSession.prompt(`Based on the following LinkedIn profile and the target company and job profile, ask the first interview question:\n\n${profileSummary}`);
      displayInterviewerMessage(openingQuestion);

  } catch (error) {
      console.error('Error starting mock interview:', error);
  } 
}

function displayInterviewerMessage(message) {
  const conversation = document.getElementById('interview-conversation');
  const messageElement = document.createElement('div');
  messageElement.className = 'interviewer-message';
  messageElement.textContent = message;
  conversation.appendChild(messageElement);

  conversation.scrollTop = conversation.scrollHeight;
}

async function handleUserResponse(userResponse) {
  if (!interviewSession) return;

  const conversation = document.getElementById('interview-conversation');
  const userMessage = document.createElement('div');
  userMessage.className = 'user-message';
  userMessage.textContent = userResponse;
  conversation.appendChild(userMessage);
  conversation.scrollTop = conversation.scrollHeight;
  


  try {
    const followUpQuestion = await interviewSession.prompt(
      `The candidate responded: "${userResponse}". What is your next question?`
    );
    displayInterviewerMessage(followUpQuestion);
  } catch (error) {
    console.error('Error generating follow-up question:', error);
  } 
}


document.getElementById('user-response-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const userResponse = document.getElementById('user-response').value.trim();
  if (userResponse) {
    await handleUserResponse(userResponse);
    document.getElementById('user-response').value = ''; // Clear input
  }
});



async function chromeAIExplainCode(txtCodeToExplain) {
    if (!txtCodeToExplain) return;
  
    document.body.querySelector('#code-explanation-text').innerText = "Analyzing code...";
  
    
    try {
        

        const codeExplanationModel = await ai.languageModel.create({
          systemPrompt : "You are an expert at understanding and explaining in multiple programming languages.",
        });
        const response = await codeExplanationModel.prompt("Explain the following code in a few bullet points:\n " + txtCodeToExplain);
        document.body.querySelector('#code-explanation-text').innerText = response.trim();
    } catch (error) {
        console.error('Code Explanation error:', error);
        document.body.querySelector('#code-explanation-text').innerText = 'Error analyzing code.';
    }
  }

chrome.storage.session.get('lastCodeToExplain', ({ lastCodeToExplain }) => {
    chromeAIExplainCode(lastCodeToExplain);
  });
  
chrome.storage.session.onChanged.addListener(async (changes) => {
    const lastCodeToExplainChange = changes['lastCodeToExplain'];
  
    if (!lastCodeToExplainChange) {
      return;
    }
  
    await chromeAIExplainCode(lastCodeToExplainChange.newValue);

});