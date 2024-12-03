# :zap: Nicoli
_Derived from the Greek word "**Nikolaos**," meaning "**victory of the people**," Nicoli is your ultimate AI-powered study and productivity companion._

## :star: About the Project
Nicoli was created to simplify studying and enhance productivity with the power of **AI**. Whether you need concise summaries, practice interview questions, or a structured task list, **Nicoli** empowers you to achieve more in less time.

## :bulb:  Inspiration
The challenges students and professionals face in managing their tasks and learning motivated the creation of **Nicoli**. With its intuitive features, Nicoli transforms how users approach productivity and education.

## :gem: Key Features
- ✂️ **Summarize Text**: Turn lengthy texts into concise summaries.
- 🌐 **Translate Text**: Translate content seamlessly into multiple languages.
- ❓ **Generate Questions**: Create quiz questions for learning reinforcement.
- 💬 **Talk to Me**: Engage with an AI chatbot for brainstorming and guidance.
- 📝 **To-Do List**: Organize tasks effortlessly.
- ⏳ **Timer**: Use timers for focused productivity sessions.
- 🎨 **Theme Customization**: Personalize your study environment.
- 🎤 **Mock Interview**: Practice interviews with LinkedIn-tailored questions.
- 🚫 **Ad Blocker**: Remove distractions by blocking unnecessary ads.

## 💻 Technologies Used
- **Languages**: HTML, CSS, JavaScript
- **APIs**:
  - **Prompt API**
  - **Summarizer API**
  - **Translator API**
  - **Language Detector API**
  - **ScrapIn API**

## 🚀 Installation Guide
- Clone the repository using `git clone https://github.com/watzal/Nicoli-Extension.git`.
- Navigate to the main folder and create a file named as `config.js`.
- Copy the contents from the provided `config.template.js` into your new `config.js` file.
- Generate your **ScrapIn API key** from [ScrapIn](https://www.scrapin.io/) and paste it into `config.js` file.
- Make sure your browser has the required model installed for **Google’s built-in AI APIs** to work seamlessly with **Nicoli**. If it’s not installed, you may not be able to use **AI-powered features** like **text summarization**, **translator**, **mock interviews** etc. Go through the [**Documentation**](https://developer.chrome.com/docs/ai/built-in-apis) in order to get the model installed.
- To use the **Prompt API** in Chrome Extensions, ensure you have the "**aiLanguageModelOriginTrial**" permission to your `manifest.json` file.
- Once done, go to the **Extensions** page `chrome://extensions/`.
- At the top right of the **Extensions** page, enable **Developer Mode** by toggling the switch.
- Click on the **Load unpacked button**, a file dialog will open. Navigate to the root folder of the **Nicoli project** that you cloned earlier.
- Copy your **Extension ID**.
- To sign up the extension for the origin trial, go the URL [Origin Trial Registration](https://developer.chrome.com/origintrials/#/view_trial/320318523496726529), now use the URL `chrome-extension://YOUR_EXTENSION_ID` as the **Web Origin** (remember to replace **YOUR_EXTENSION_ID** with the **copied** Extension ID). For example, `chrome-extension://ljjhjaakmncibonnjpaoglbhcjeolhkk`.
![](https://developer.chrome.com/static/docs/extensions/ai/prompt-api/images/ot-web-origin.jpg)
- After you've signed up for the original trial, you receive a **generated token**, which you need to pass in an array as the value of the **trial_tokens** field in the `manifest.json file`.
 ```
  "manifest_version": 3,
  "trial_tokens": ["GENERATED_TOKEN"],
  ```
- Save changes, reload extension and start using the **Nicoli** extension in your browser.
