/**
 * This file contains the customization done to Dialogflow Messenger
 * See the 'dfMessengerLoaded' event listener for the various features that have been added.
 * 
 * Notes on the population of initial messages:
 *   This was added programatically rather than using the default welcome message intents from Dialogflow because there is a monetary cost associated with the default behavior
 *   The custom message contents can be Text/Html or JSON.  Html support allows for some custom styling of text.  JSON allows for dialogflow rich messages, such as chips.
 *   For rich message types, currently only Chips has been implemented/tested.
 *   
 *   Example 1 (Html): <p>This is a Sample welcome message</p><p>This is the second line, and this is <b>bold</b></p>
 *   Example 2 (JSON): {"type": "chips","options": [{"text": "Sample Chip 1"},{"text": "Sample Chip 2"}]}
 *   
 * Notes on df-messenger session-id:
 *   The Session Id value used for dialogflow communication is generated in the backend using the format <frontend id>_<random alphanumeric>
 *   Example: GOV-COVID_lkji9cE8LQi1KfBWawIc
 *   
 * Dialogflow Messenger documentation: 
 * https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger
 * 
 */

// Globals
const WINDOW_STATE_CLOSED = 'CLOSED';
const WINDOW_STATE_MINIMAL = 'MINIMAL';
const WINDOW_STATE_OPEN = 'OPEN';
const WINDOW_STATE_VAR_NAME = "chatWindowState";
const SNOWPLOW_MSG_SCHEMA = 'iglu:ca.bc.gov.chatbot/chatbot/jsonschema/2-0-0';
const SNOWPLOW_ERR_SCHEMA = 'iglu:ca.bc.gov.chatbot/error/jsonschema/2-0-0';
const SNOWPLOW_METHOD = 'trackSelfDescribingEvent';

// Breakpoint where DF Messenger switches between mobile/non-mobile styles (pixels)
const NON_MOBILE_MIN_WIDTH = 501; 

// Indicate whether or not the chat history should persist so that it can be maintained between page loads / refresh (VA-72)
const MAINTAIN_CHAT_SESSION = false;

// How long to keep session values such as chat history (milliseconds).  Only applicable when MAINTAIN_CHAT_SESSION = true.
const LOCAL_SESSION_EXPIRE_TIME = 20 * 60 * 1000; // 20 Minutes

// Event handler for when Dialogflow Messenger is loaded.  This is the main method for this file.
window.addEventListener('dfMessengerLoaded', function (event) {

	const dfMessenger = document.querySelector('df-messenger');	
	
	// no-op if no df-messenger element can be found (RA-1353)
	if ( !dfMessenger ) {
		return;
	}
	
	// Load the initial welcome messages into the messenger window
	populateInitialMessages();
	
	// Apply any custom css to the messenger
	applyCustomStyles();
	
	// Track current state and restore previous (chat history, window state, sessionId)
	initializeStatePersistence();
	
	// Add snowplow analytics handlers (RA-1352, VA-43)
	setupAnalytics();
	
	// Apply fixes for IE11 issues due to it not supporting CSS variables (RA-1354)
	addLegacyBrowserSupport();
	
	// Add keyboard navigation and other accessibility related features
	addAccessibilityFeatures();
	
	// Add a general handler for received messages
	dfMessenger.addEventListener('df-response-received', function (event) {		
		responseReceivedHandler(event);
	});
	
});	

// A response has been received from Dialogflow. Reapply functions to the new messages.
function responseReceivedHandler(event) {
	
	// Wait until the messages are available
	setTimeout(function () {
	
		// Process bot responses and render HTML (RA-1343)
		processBotMessages();	
		
		// Ensure that the input box is in focus.  It won't always be otherwise, for example after a user clicks a chip.
		getInputFieldElement().focus();
			
		// Add navigability to the newly received messages
		updateMessagesForNavigation();
		
		if (MAINTAIN_CHAT_SESSION) {
			// Persist Chat history and sessionId to Browser Local Storage (RA-1357)
			saveChatSession();
		}
		
	}, 0);
}

function applyCustomStyles() {
	
	const dfMessenger = document.querySelector('df-messenger');	
	
	// Set max-height on chatbot window,- only for non-mobile (RA-1344)
	const style = document.createElement('style');

    style.textContent = '@media screen and (min-width: ' + NON_MOBILE_MIN_WIDTH + 'px) { .chat-wrapper { max-height: 65% } }';
	dfMessenger.shadowRoot.querySelector('df-messenger-chat')
		.shadowRoot.appendChild(style);
	
	// Fix for chat window sizing issue in Safari mobile (RA-1341)
	if(/iPhone/i.test(navigator.userAgent)) {
		getInputFieldElement().setAttribute('style','font-size: 16px');	
	}
}


// ANALYTICS START //

// Add handlers for snowplow analytics (RA-1352, RA-1365)
function setupAnalytics() {
	
	const dfMessenger = document.querySelector('df-messenger');
	
	if (getChatWindowState() === WINDOW_STATE_MINIMAL) {
		
		// Snowplow analytics event - User has visited a page where the chatbot is in minimal state
		window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "hello", null));	
		
		// Add an event listener to capture when the user clicks the welcome message to expand the chat window
		const dfWelcomeMessage = getMessageListDivElement();
		if (dfWelcomeMessage) {
			dfWelcomeMessage.addEventListener('click', welcomeMessageClickHandlerCallback);
		}
	}
	
	dfMessenger.addEventListener('df-request-sent', function(event) {
		requestSentHandler(event);
	});
	
	dfMessenger.addEventListener('df-response-received', function (event) {		
		responseReceivedHandlerForAnalytics(event);
	});
		
	dfMessenger.addEventListener('df-messenger-error', function(event) {
		messengerErrorHandler(event);
	});
	
	const dfButtonWidgetIcon = dfMessenger.shadowRoot.querySelector('button#widgetIcon');
	if (dfButtonWidgetIcon) {
		dfButtonWidgetIcon.addEventListener('click', buttonWidgetIconCallbackFuctionForAnalytics);
	}

	const dfDismissIcon = dfMessenger.shadowRoot.querySelector('df-messenger-chat').shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('div.message-list-wrapper div#dismissIcon');
	if (dfDismissIcon) {
		dfDismissIcon.addEventListener('click', dismissIconCallbackFuctionForAnalytics);
	}
}

//The user has clicked on the chat icon to either open or close the chat window
function buttonWidgetIconCallbackFuctionForAnalytics() {
	
	if (getChatWindowState() === WINDOW_STATE_OPEN) {
		
		// Snowplow analytics event - User clicked the chat icon to close the chat window
		window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "close", "icon"));
		
	} else if (getChatWindowState() === WINDOW_STATE_CLOSED) {
		
		// Snowplow analytics event - User clicked the chat icon to open the chat window
		window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "open", "icon"));
	}
}

// The user has clicked on the welcome message to open the chat window
function welcomeMessageClickHandlerCallback() {
	
	const dfWelcomeMessage = getMessageListDivElement();

	// Snowplow analytics event - User clicked the welcome message to open the chat window
	window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "open", "hello"));

	// We only want to capture this event once, so remove it now.
	dfWelcomeMessage.removeEventListener("click", welcomeMessageClickHandlerCallback);
}

// The user has click the dismiss icon, which is the X on the initial minimized chat window
function dismissIconCallbackFuctionForAnalytics() {
	
	// Snowplow analytics event - User closes chat window via the X icon
	window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "close", "x"));
}

function messageHyperlinkClickHandlerCallback(event) {
	
	const href = event.currentTarget.href;
	
	// Snowplow analytics event - User clicked a hyperlink that was included in a chat response message
	window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "link_click", href));
}

function responseReceivedHandlerForAnalytics(event) {
	
	const queryResult = event.detail.response.queryResult;
	const intentName = queryResult.intent.displayName;
	
	var jsonPayload = buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "get_answer", intentName);
	
	// Add some additional values relating to the Dialogflow response
	jsonPayload.data["intent_confidence"] = queryResult.intentDetectionConfidence;
	
	// There will be a sentimentAnalysis element if SA is enabled in Dialogflow (VA-9)
	if (queryResult.sentimentAnalysisResult) {
		
		jsonPayload.data["sentiment"] = {};
		
		if (queryResult.sentimentAnalysisResult.queryTextSentiment) {
			jsonPayload.data.sentiment["score"] = queryResult.sentimentAnalysisResult.queryTextSentiment.score;
			jsonPayload.data.sentiment["magnitude"] = queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
		}
	}

	// Snowplow analytics event - A response was received from Dialogflow
	window.snowplow(SNOWPLOW_METHOD, jsonPayload);
}

function requestSentHandler(event) {
	
	// Snowplow analytics event - a question was submitted to Dialogflow
	window.snowplow(SNOWPLOW_METHOD, buildSnowplowPayload(SNOWPLOW_MSG_SCHEMA, "ask_question", null));
}

// Send the error details to snowplow for analytics
function messengerErrorHandler(event) {
	
	var jsonPayload = buildSnowplowPayload(SNOWPLOW_ERR_SCHEMA, null, null);
	
	const error = event.detail.error.error;
	
	jsonPayload.data["code"] = '' + error.code;
	jsonPayload.data["message"] = error.message;
	jsonPayload.data["status"] =  error.status;
	
	// Snowplow analytics event - An error occurred
	window.snowplow(SNOWPLOW_METHOD, jsonPayload);
}

// Build the common json payload used to send to snowplow analytics
// Note, CHATBOT_FRONTEND_ID is defined in Chatbot.jsp
function buildSnowplowPayload(schema, action, text) {
	
	const dfMessenger = document.querySelector('df-messenger');
	
	var jsonPayload = {
		schema: schema,
	    data: 
	    {                   	
        	agent : dfMessenger.getAttribute("agent-id"),
        	frontend_id : CHATBOT_FRONTEND_ID,
        	session_id : dfMessenger.getAttribute("session-id")
	     }
	};
	
	if (action) {
		jsonPayload.data["action"] = action;
	}
	if (text) {
		jsonPayload.data["text"] = text;
	}
	    
	return jsonPayload;
}

// ANALYTICS END //


// PERSISTENCE START //

// This is used to restore the state of the window and chat history if the user navigates to another page
function initializeStatePersistence() {
	
	initializeStateTracking();
	
	initializeChatWindowState();
	
	if (MAINTAIN_CHAT_SESSION) {
		restoreChatSession();
	}
}

// Add event listeners to track what state the chatbot is in (Open or Closed).  The state will be persisted.
function initializeStateTracking() {
	
	const dfMessenger = document.querySelector('df-messenger');
	
	// Set up event listener for button click
	const dfButtonWidgetIcon = dfMessenger.shadowRoot.querySelector('button#widgetIcon');
	if (dfButtonWidgetIcon ) {
		dfButtonWidgetIcon.addEventListener('click',buttonWidgetIconCallbackFuctionForPersistence);
	}
	
	// Setup event listener for dismiss icon
	const dfDismissIcon = dfMessenger.shadowRoot.querySelector('df-messenger-chat').shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('div.message-list-wrapper div#dismissIcon');
	if (dfDismissIcon ) {
		dfDismissIcon.addEventListener('click', dismissIconCallbackFuctionForPersistence);
	}
	
    // The minimize icon is only visible on mobile devices
    const minimizeIcon = dfMessenger.shadowRoot.querySelector('df-messenger-chat')
        .shadowRoot.querySelector('df-messenger-titlebar')
        .shadowRoot.querySelector('div.title-wrapper')
        .querySelector('svg #minimizeIcon');
    
    if (minimizeIcon) {
        minimizeIcon.addEventListener('click',dismissIconCallbackFuctionForPersistence);
    }
	
	// Setup event for chatwindow click
	const dfChatWindow = getMessageListDivElement();
	
	if (dfChatWindow) {
		dfChatWindow.addEventListener('click',dialogueOpenCallbackFuction);
	}
}

//Set the chat window to min, closed, or open depending on state
function initializeChatWindowState() {
	
	const dfMessenger = document.querySelector('df-messenger');	
	const savedWindowState = getSavedWindowState();
	var savedChatSession = null;
	
	if (MAINTAIN_CHAT_SESSION) {
		savedChatSession = getSavedChatSession();
	}
	
	if (savedWindowState) {
		if(savedWindowState === WINDOW_STATE_OPEN && savedChatSession) {
			// The chat bot window has been opened and the user has interacted with it.  Restore the expanded window.
			
			// Show the window
			dfMessenger.showMinChat();
						
			// Expand the window
			getMessageListDivElement().click();
			
		} else if (savedWindowState === WINDOW_STATE_OPEN) {
			// The user had opened the window, but didn't interact with it.  Set it to its minimal state.
			document.querySelector('df-messenger').showMinChat();
		}
		else { 
			// The chat window had been closed by the user, so initialize its state to closed.
			dfMessenger.removeAttribute("expand");
		}
	} else {
		// Default state (minimal)
		
		// Show the initial message immediately if on a larger screen (non-mobile)
		if(document.documentElement.clientWidth >= NON_MOBILE_MIN_WIDTH) {
			dfMessenger.showMinChat();
		}	
	}
}

// The user has click the dismiss icon, which is the X on the initial minimized chat window
function dismissIconCallbackFuctionForPersistence() {
    updateWindowState(WINDOW_STATE_CLOSED);
}

// The user has clicked on the minimized chat window to open it
function dialogueOpenCallbackFuction() {
    updateWindowState(WINDOW_STATE_OPEN);
}

// The user has clicked on the chat icon to either open or close the chat window
function buttonWidgetIconCallbackFuctionForPersistence() {
	
    const chatWindowState = getChatWindowState();
    
    if (chatWindowState === WINDOW_STATE_CLOSED) {
        // The window is being opened
        
        const divChatWrapper = document.querySelector('df-messenger')
            .shadowRoot.querySelector('df-messenger-chat')
            .shadowRoot.querySelector('.chat-wrapper');
        
        // Check if the window will be being opened to its minimal state (user had never opened it)
        const openingToMinimal = divChatWrapper.classList.contains('chat-min');
        
        if (openingToMinimal) {
            updateWindowState(WINDOW_STATE_MINIMAL);
        } else {
            updateWindowState(WINDOW_STATE_OPEN);
        }
        
    } else {
        // The window is being closed
        updateWindowState(WINDOW_STATE_CLOSED);
    }
}

// Load any saved chat history into the chat window
function restoreChatSession() {
	
	const savedChatSession = getSavedChatSession();

	if(savedChatSession) {
		
		const dfMessenger = document.querySelector('df-messenger');
		dfMessenger.setAttribute('session-id', savedChatSession.sessionId);
		
		const conversationBox = getMessageListDivElement();
		conversationBox.innerHTML = savedChatSession.chatHistory;
		
		// Scroll to Bottom
		const lastChildHeight = conversationBox.lastChild.offsetHeight+15;
		conversationBox.scrollTop = conversationBox.scrollHeight-lastChildHeight;
	}	
}

// Save the chat history to sessionStorage so that the entire conversation can follow the user around while they navigate the site or refresh the page
function saveChatSession() {

	const keyName = getChatSessionKeyName();
	const sessionId = document.querySelector('df-messenger').getAttribute("session-id");
	const chatHistory = getMessageListDivElement().innerHTML
	const now = new Date();
	const expiryTime = now.getTime() + LOCAL_SESSION_EXPIRE_TIME;
	
	const chatSessionObject = {
		sessionId: sessionId,
		chatHistory: chatHistory,
		expiryTime:expiryTime
	}
	
	// Use sessionStorage so the session only lives within the context of a browser tab
	sessionStorage.setItem(keyName, JSON.stringify(chatSessionObject));
}

// Return the chat session sessionStorage variable if it hasn't expired
function getSavedChatSession() {
	
	const keyName = getChatSessionKeyName();
	const storageObject = sessionStorage.getItem(keyName);
	
	if (!storageObject) {
		return;
	}
	
	const chatSessionObject = JSON.parse(storageObject);
	const now = new Date();
	
	// compare the expiry time
	if (now.getTime() > chatSessionObject.expiryTime) {
		// If the item is expired, delete the item from storage and return null
		sessionStorage.removeItem(keyName)
		return null;
	}
	
	return chatSessionObject;
}

// Return a key name to be used to store the session
// Using FrontendId and Agent Id will identify the scope of the session.  Note, CHATBOT_FRONTEND_ID is defined in chatbot.jsp
function getChatSessionKeyName() {
	
	// Use the agentId rather than sessionId to identify the conversation since sessionId changes on page load/refresh
	const agentId = document.querySelector('df-messenger').getAttribute("agent-id");
	
	return CHATBOT_FRONTEND_ID + "_" + agentId;
}

// Update any necessary stored values and labels appropriate to the changing window state
function updateWindowState(windowState) {
    
	sessionStorage.setItem(WINDOW_STATE_VAR_NAME, windowState);
    
    if (windowState == WINDOW_STATE_OPEN || windowState == WINDOW_STATE_MINIMAL) {
        updateIconAriaLabel('Close');
    } else if (windowState == WINDOW_STATE_CLOSED) {
        updateIconAriaLabel('Open');
    } else {
        // This should never happen
        console.log("Invalid window state: " + windowState);
    }
}

function getSavedWindowState() {
	return sessionStorage.getItem(WINDOW_STATE_VAR_NAME);
}

// PERSISTENCE END

// INITIAL MESSAGE POPULATION START //

function populateInitialMessages() {
	
	// Load the message from the hidden page element
	const initialMessageContainer = document.querySelector('#chatbot-initial-message');
	
	if(initialMessageContainer) {
		
		const initialMessageHtml = initialMessageContainer.innerHTML;
		
		if(initialMessageHtml.length > 0) {
			
			//Render the first message in the chatbot
			renderCustomMessage(initialMessageHtml);
			
			// Render the second message if it is populated
			const initialMessageHtml2 = document.querySelector('#chatbot-initial-message2').innerHTML;
			renderCustomMessage(initialMessageHtml2);					
			
			// Render the third message if it is populated
			const initialMessageHtml3 = document.querySelector('#chatbot-initial-message3').innerHTML;
			renderCustomMessage(initialMessageHtml3);
			
			// Process the messages so they display html, have click handlers etc
			processBotMessages();
			
		}
	}
}

// Render a custom card.  Message formats supported are JSON and text/html
function renderCustomMessage(message) {
	
	if (message.length > 0) {	
		const dfMessenger = document.querySelector('df-messenger');
		
		if (message.trim().startsWith("{")) {
			const jsonMessage = JSON.parse('[' + message + ']');					
			dfMessenger.renderCustomCard(jsonMessage);	
		} else {
			dfMessenger.renderCustomText(message);
		}
	}
}

function processBotMessages() {

	// Process text responses
	processTextResponses();

	// Process card responses
	processCardResponses();
}

function processTextResponses() {

	const botMessages = getMessageListDivElement().querySelectorAll('.bot-message');
	
	botMessages.forEach(function(message) {
		processMessageHtml(message);
	})	
}

function processCardResponses() {

	const botCards = getMessageListDivElement().querySelectorAll('df-card');
		
	botCards.forEach(function(card) {	

		// card message type
		const dfDescription = card.shadowRoot.querySelector('df-description');
		if (dfDescription) {
			const descriptionLines = dfDescription.shadowRoot.querySelectorAll('.description-line');
			
			descriptionLines.forEach(function(desc) {
				processMessageHtml(desc);
			})	
		}
	})		
}

function processMessageHtml(element) {
	
	// If element hasn't previously been processed, override the innerHTML with the innerText value to render any Html formatting
	if(!element.classList.contains('bcgov-message-processed')) {
		element.innerHTML = element.textContent;	
		
		// RA-1365: add click event handlers to any anchor tags in the response
		const dfMessageLinks = element.querySelectorAll('a');
		dfMessageLinks.forEach(function(link) {
			link.onclick = messageHyperlinkClickHandlerCallback;
		});		
			
		element.classList.add('bcgov-message-processed');			
	}
}

// INITIAL MESSAGE POPULATION END //


// ACCESSIBILITY START //

function addAccessibilityFeatures() {
	
	const dfMessenger = document.querySelector('df-messenger');
	const dfMessengerChat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
	const messageList = getMessageListDivElement();
	const dismissIcon = dfMessengerChat.shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('#dismissIcon');
	const chatbotIcon = dfMessenger.shadowRoot.querySelector('#widgetIcon');	
	const chatbotTitle = dfMessengerChat.shadowRoot.querySelector('df-messenger-titlebar').shadowRoot.querySelector('#dfTitlebar').textContent;	
	
	// Add aria labels
	getInputFieldElement().setAttribute('aria-label', 'Ask something');
	messageList.setAttribute('aria-label', chatbotTitle)
	dismissIcon.setAttribute('aria-label','Dismiss message window');

    const windowState = getChatWindowState();

    if (getChatWindowState() === WINDOW_STATE_CLOSED) {
        updateIconAriaLabel('Open');
    } else {
        updateIconAriaLabel('Close');
    }
    
	// Make elements tabbable
	messageList.setAttribute('tabindex','0');	
	dismissIcon.setAttribute('tabindex','0');
	chatbotIcon.setAttribute('tabindex','0');

	// Add additional attributes for accessibility
	messageList.setAttribute('role', 'log');
	messageList.setAttribute('aria-live', 'polite');
	messageList.setAttribute('aria-atomic', 'false');
	
	// Add border to icon when focused
	const chatbotIconStyle = document.createElement('style')
    chatbotIconStyle.textContent = 'button#widgetIcon:focus { outline-width: 1px }';
	dfMessenger.shadowRoot.appendChild(chatbotIconStyle);
	
	setupKeyboardNavigation();
	
}

function updateIconAriaLabel(action) {
	
	const dfMessenger = document.querySelector('df-messenger');	
	const chatbotIcon = dfMessenger.shadowRoot.querySelector('#widgetIcon');	
	const chatbotTitle = dfMessenger.shadowRoot.querySelector('df-messenger-chat')
		.shadowRoot.querySelector('df-messenger-titlebar')
		.shadowRoot.querySelector('#dfTitlebar').textContent;
	
	chatbotIcon.setAttribute('aria-label', action + ' ' + chatbotTitle);
}

// Setup key handlers to allow users to use the keyboard to interact with the chatbot (RA-1340)
function setupKeyboardNavigation() {

	updateMessagesForNavigation();

	// Add event listener on keydown
	document.addEventListener('keydown', function(keyboardEvent) {

		const dfMessenger = document.querySelector('df-messenger');
		
		if(dfMessenger === document.activeElement) {
			
			if(keyboardEvent.keyCode == 13) { // enter key
				handleEnterKey(keyboardEvent)				
			}
			else if(keyboardEvent.keyCode == 27) { // escape key
				const chatbotIcon = dfMessenger.shadowRoot.querySelector('#widgetIcon');
				chatbotIcon.click();
			}

			else if(keyboardEvent.keyCode == 38) { // up key
				handleUpKey(keyboardEvent);
			}

			else if(keyboardEvent.keyCode == 40) { // down key
				handleDownKey(keyboardEvent);								
			}
		}
	});
}

//Update the elements in the chat window so that they are keyboard navigable
function updateMessagesForNavigation() {
	
	const messageList = getMessageListDivElement();	
	const messages = messageList.querySelectorAll('.message');
	const dfChips = messageList.querySelectorAll('df-chips');
	
	// Make all messages navigable/focusable	
	messages.forEach(function(message) {
		message.setAttribute('tabindex', '-1');
	})

	// Make all the chips navigable/focusable
	dfChips.forEach(function(aChip) {
		const aTags = aChip.shadowRoot.querySelector('.df-chips-wrapper').querySelectorAll('a');

		aTags.forEach(function(aTag) {
			aTag.setAttribute('tabindex', '-1');
		})
	})
}

function handleUpKey(keyboardEvent) {

	const dfMessenger = document.querySelector('df-messenger');
	const messageList = getMessageListDivElement();
	const dfMessengerChat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
	const chatWrapper = dfMessengerChat.shadowRoot.querySelector('.chat-wrapper');
	const inputFieldFocused = chatWrapper.querySelector('df-messenger-user-input').shadowRoot.querySelector('input:focus');
	const messageFocused = messageList.querySelector('.message:focus');	
	const dfChips = messageList.querySelectorAll('df-chips');
	
	keyboardEvent.preventDefault();	
	
	let focusedChip;
	let focusedDFChip;
	
	if (dfChips) {
		// find the chip that is in focus, if any
		dfChips.forEach(function(aChip) {
			const focused = aChip.shadowRoot.querySelector('.df-chips-wrapper').querySelector('a:focus');
			if (focused) {
				focusedChip = focused
				focusedDFChip = aChip;
			}
		})
	}
	
	// If focus currently on input field, move focus to the message list
	if(inputFieldFocused) {	
		const lastMessage = messageList.lastChild;
		
		if (lastMessage.classList.contains('message')) {
			lastMessage.focus();
		} else if (lastMessage.nodeName.toUpperCase() === 'DF-CHIPS') {
			lastMessage.shadowRoot.querySelector('.df-chips-wrapper').lastChild.focus();
		}					
	}
	// If focus on a message and there is a previous message, move focus to it
	else if(messageFocused && messageFocused.previousSibling && messageFocused.previousSibling.nodeType === 1) {
		
		const prevSibling = messageFocused.previousSibling;
		
		// There can be an empty chips element after it had been submitted.  Skip it.
		if (prevSibling.nodeName.toUpperCase() === 'DF-CHIPS' && !prevSibling.hasChildNodes()) {	
			prevSibling.previousSibling.focus();
		} else {
			prevSibling.focus();
		}
		
	}
	// If focus on a chip, move to the previous chip. If no previous chip move to previous message
	else if(focusedChip) {
		if (focusedChip.previousSibling) {
			focusedChip.previousSibling.focus();
		} else if (focusedDFChip.previousSibling) {
			
			const prevSibling = focusedDFChip.previousSibling;
			
			if (prevSibling.classList.contains('message')) {
				prevSibling.focus();
			} else if (prevSib.nodeName.toUpperCase() === 'DF-CHIPS') {							
				prevSibling.shadowRoot.querySelector('.df-chips-wrapper').lastChild.focus();
			}
		}										
	}
	
}

function handleDownKey(keyboardEvent) {
	
	const messageList = getMessageListDivElement();
	const inputField = getInputFieldElement();
	const messageFocused = messageList.querySelector('.message:focus');					
	const dfChips = messageList.querySelectorAll('df-chips');
	
	keyboardEvent.preventDefault();		
	
	let focusedChip;
	let focusedDFChip;
	
	if (dfChips) {
		// find the chip that is in focus, if any
		dfChips.forEach(function(aChip) {
			const focused = aChip.shadowRoot.querySelector('.df-chips-wrapper').querySelector('a:focus');
			if (focused) {
				focusedChip = focused
				focusedDFChip = aChip;
			}
		})
	}
	
	// If focus on a message and there is another message following, shift focus to it. Otherwise shift focus to input field
	if(messageFocused && messageFocused.nextSibling && messageFocused.nextSibling.nodeType === 1) {
		
		const nextSibling = messageFocused.nextSibling;
		
		if (nextSibling.classList.contains('message')) {
			nextSibling.focus();
		}
		else if (nextSibling.nodeName.toUpperCase() === 'DF-CHIPS') {
			
			const dfChipsWrapper = nextSibling.shadowRoot.querySelector('.df-chips-wrapper')
			
			// There can be an empty chips element after it had been submitted.  Skip it.
			if (dfChipsWrapper.classList.contains('clicked') || !nextSibling.chips || nextSibling.chips.length < 1) {
				const nextNextSibling = nextSibling.nextSibling;
				if (nextNextSibling) {
					if (nextNextSibling.classList.contains('message')) {
						nextNextSibling.focus();
					}
				}
				
			} else {
				nextSibling.shadowRoot.querySelector('.df-chips-wrapper').firstChild.focus();
			} 						
		}						
	} 
	else if(focusedChip) {
		if (focusedChip.nextSibling) {
			focusedChip.nextSibling.focus();
		} else if (focusedDFChip.nextSibling) {
			
			const nextSibling = focusedDFChip.nextSibling;
			
			if (nextSibling.classList.contains('message')) {
				nextSibling.focus();
			} else if (nextSibling.nodeName.toUpperCase() === 'DF-CHIPS') {							
				nextSibling.shadowRoot.querySelector('.df-chips-wrapper').firstChild.focus();
			}
		} else {
			inputField.focus();	
		}								
	} else {
		inputField.focus();											
	}

}

// Handle the Enter key press
// Check to see what element is in focus, and if there is an actionable one then perform its action (click).
function handleEnterKey(keyboardEvent) {
	
	const dfMessenger = document.querySelector('df-messenger');
	const messageList = getMessageListDivElement();
	const dfMessengerChat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
	const dismissIcon = dfMessengerChat.shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('#dismissIcon');
	const chatbotIconFocused = dfMessenger.shadowRoot.querySelector('#widgetIcon:focus');
	const messageListFocused = dfMessengerChat.shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('#messageList:focus');
	const dismissIconFocused = dfMessengerChat.shadowRoot.querySelector('df-message-list').shadowRoot.querySelector('#dismissIcon:focus');
	const inputField = getInputFieldElement();
	
	const dfChips = messageList.querySelectorAll('df-chips');
	
	let focusedChip;

	if (dfChips) {
		// find the chip that is in focus, if any
		dfChips.forEach(function(aChip) {
			const focused = aChip.shadowRoot.querySelector('.df-chips-wrapper').querySelector('a:focus');
			if (focused) {
				focusedChip = focused
			}
		})
	}
	
	// If the focus is currently on the chat icon, click it and set the focus accordingly
	if(chatbotIconFocused) {

		chatbotIconFocused.click();

		if (getChatWindowState() === WINDOW_STATE_CLOSED) {
			
            messageList.setAttribute('tabindex','0');    
            dismissIcon.setAttribute('tabindex','0');
            
			const savedWindowState = getSavedWindowState();
			
			// If the saved window state is open, it will be opening the window fully, so focus on the text input box
			if (savedWindowState === WINDOW_STATE_OPEN) {
				inputField.focus();
			} else {
				// The window will be in minimal state.  Put focus on the message list
				messageList.focus();	
			}
		} else {
			// The window is being closed
			messageList.removeAttribute('tabindex');
			dismissIcon.removeAttribute('tabindex');
			
			// Without calling blur the window won't close
			chatbotIconFocused.blur();
			
			// Return the focus to the chat icon after the click event is complete (window is closed)
			setTimeout(function () {
				chatbotIconFocused.focus();
			}, 0);
		}			
	}
	// If focus is currently on the message list, click it and set focus on first message
	else if(messageListFocused) {
		messageList.click();
        messageList.querySelector('.message').focus();
	} 
	// If focus is currently on the dismiss icon, click it
	else if(dismissIconFocused) {
		dismissIcon.click();
		messageList.removeAttribute('tabindex');	
		dismissIcon.removeAttribute('tabindex');				
	}	
	else if (focusedChip) {
		focusedChip.click();
	}
	
}

// ACCESSIBILITY END //

// LEGACY BROWSER SUPPORT START //

function addLegacyBrowserSupport() {

	// Check if the browser has support for CSS custom properties (IE11 does not). If unsupported, manually attach additional styles.
	if(!window.CSS || !window.CSS.supports || !window.CSS.supports('--a', 0)) {

		const dfMessenger = document.querySelector('df-messenger');

		// Find the style tag containing the CSS variables (should be directly above df-messenger)
		const chatbotStyleTag = dfMessenger.previousElementSibling;	
		let chatbotStyles = chatbotStyleTag.textContent
		
		// Remove whitespace and other parts of the string that aren't needed
		chatbotStyles = chatbotStyles.replace(/\s+/g, '');
		chatbotStyles = chatbotStyles.replace('df-messenger{', '');
		chatbotStyles = chatbotStyles.replace('}', '');	
		chatbotStyles = chatbotStyles.split(';');

		// Create map of CSS property name-value pairs
		let cssNameValueMap = new Map();
		chatbotStyles.forEach(function(style) {
			let cssNameValuePair = style.split(':');
			cssNameValueMap.set(cssNameValuePair[0], cssNameValuePair[1]);
		});		

		// Set chatbot icon colour
		const iconColour = document.createElement('style');
	    iconColour.textContent = 
	    	'.df-messenger-1 button.df-messenger#widgetIcon { background-color: ' + cssNameValueMap.get('--df-messenger-button-titlebar-color') + '; }';
		dfMessenger.shadowRoot.appendChild(iconColour);	
		
		// Add a border around the widget icon when in focus
		const iconFocusBorder = document.createElement('style');
		iconFocusBorder.textContent = '.df-messenger-1 button.df-messenger#widgetIcon:focus { outline: 1px solid black;}';
		dfMessenger.shadowRoot.appendChild(iconFocusBorder);
		
		// Set chatbot title bar colour
		const titleBarColour = document.createElement('style');
	    titleBarColour.textContent = 
	    	'.df-messenger-titlebar-1 .title-wrapper.df-messenger-titlebar { background-color: ' + cssNameValueMap.get('--df-messenger-button-titlebar-color') + '; }';
		dfMessenger.shadowRoot.querySelector('df-messenger-chat')
			.shadowRoot.querySelector('df-messenger-titlebar')
			.shadowRoot.appendChild(titleBarColour);				

		// Set chatbot send icon colour
		const sendIconColour = document.createElement('style');
	    sendIconColour.textContent = 
	    	'.df-messenger-user-input-1 .df-messenger-user-input .df-messenger-user-input#sendIcon, ' +
	    	'.df-messenger-user-input-1 .df-messenger-user-input .df-messenger-user-input#sendIcon:hover, ' +
	    	'.df-messenger-user-input-1 .df-messenger-user-input .df-messenger-user-input#sendIcon:active { background-color: ' + cssNameValueMap.get('--df-messenger-send-icon') + '; }';
	    
		dfMessenger.shadowRoot.querySelector('df-messenger-chat')
			.shadowRoot.querySelector('df-messenger-user-input')
			.shadowRoot.appendChild(sendIconColour);
		
		// Set chatbot bot message colour
		const botMessageColour = document.createElement('style')
	    botMessageColour.textContent = '.df-message-list-1 .df-message-list#messageList .message.bot-message.df-message-list { background-color: #fff; }';
		dfMessenger.shadowRoot.querySelector('df-messenger-chat')
			.shadowRoot.querySelector('df-message-list')
			.shadowRoot.appendChild(botMessageColour);	
		
		var messageList = getMessageListDivElement();
		
		// IE11 - This fixes a very minor issue of the chat window scroll not being quite at the bottom after a question is submitted
		messageList.style.display = "inline";
		
		// IE11 - Apply flex style setting to df-chips elements to prevent a text overlapping issue when using chips
		const dfChips = messageList.querySelectorAll('df-chips');
		
		if (dfChips) {
			dfChips.forEach(function(aChip) {
				aChip.style.flex = "none"; 
			})
		}
	}	
}

// LEGACY BROWSER SUPPORT END //


// HELPER METHODS

/**
 * Return the state of the chat window.  It may be in one of three states:
 * WINDOW_STATE_MINIMAL - Used as the default state where it only shows a single welcome message
 * WINDOW_STATE_OPEN - The User has expanded the window and it shows the full message list and input field
 * WINDOW_STATE_CLOSED - The user has closed the window, so only the chat icon remains
 */
function getChatWindowState() {
	
	const dfMessenger = document.querySelector('df-messenger');
	const divChatWrapper = dfMessenger.shadowRoot.querySelector('df-messenger-chat').shadowRoot.querySelector('.chat-wrapper');
    const openedAttribute = divChatWrapper.getAttribute('opened');
	
    if (openedAttribute === 'false' || (!openedAttribute && !divChatWrapper.classList.contains('chat-min'))) {
        return WINDOW_STATE_CLOSED;
    } else {
        if (openedAttribute === 'true') {
            return WINDOW_STATE_OPEN;
        } else {
            return WINDOW_STATE_MINIMAL;
        }
	}
}

//Return the message list element
function getMessageListDivElement() {
	
	return document.querySelector('df-messenger')
		.shadowRoot.querySelector('df-messenger-chat')
		.shadowRoot.querySelector('df-message-list')
		.shadowRoot.querySelector('div.message-list-wrapper div#messageList');
}

// Return the input text box element
function getInputFieldElement() {
	
	return document.querySelector('df-messenger')
		.shadowRoot.querySelector('df-messenger-chat')
		.shadowRoot.querySelector('df-messenger-user-input')
		.shadowRoot.querySelector('input[type="text"]');
}

