import React from 'react';
import ReactDOM, { render } from 'react-dom';
import './index.css';

function Message(props) {
    const className = props.type + " message";
    return(
        <label className={className}>{props.message}</label>
    );
}

class BotMessage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            message: "",
        }
    }

    componentDidMount() {
        console.log(this.props.request);
        fetch('https://us-central1-to-do-list-266601.cloudfunctions.net/talkToDF', {
            method: 'POST',
            body: JSON.stringify(this.props.request)
        })
        .then(res => res.json())
        .then((response) => {
            console.log(response);
            this.props.handleDFResponse(response.sessionID, response.outputContexts, response.fulfillmentMessages);
            this.setState({
                message: response.responseText,
                isLoaded: true,
            });
        },
        (error) => {
            this.setState({
                isLoaded: true,
                error: error,
            })
        }); 
    }

    render() {
        const { error, isLoaded, message } = this.state;
        if (error) {
            return <label className="bot message">Error: {error.message}</label>;
        } else if (!isLoaded) {
            return <label className="bot message">Loading...</label>;
        } else {
            return <label className="bot message">{message}</label>;  
        }
    }

}

class ToDo extends React.Component {
    render() {
        return(
            <div className="to-do">
                <label className="to-do-text">{this.props.toDo}</label>
                <div className="to-do-buttons">
                    <button className="delete"onclick={this.props.deleteItem(this.props.toDo)}></button>
                    
                    <button className="add" onclick={this.props.addComment(this.props.toDo)}></button>
                </div>
            </div>
        )
    }
}

class ToDoList extends React.Component {
    render() {
        return(
            <div className="to-do-list">
                {this.props.toDos}
            </div>
        )
    }
}

class MessageBox extends React.Component {
    constructor(props) {
        super(props);
        this.messagesEnd = React.createRef();
    }

    componentDidUpdate () {
        this.messagesEnd.current.scrollIntoView({behavior:"smooth"});
    }

    render() {
        return(
            <div className="message-box">
                {this.props.messages}
                <div style={{ float:"left", clear: "both" }}
                    ref={this.messagesEnd}>
                </div>
            </div>
        );
    }
}

class ChatBot extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: Array(0),
            inputValue: "",
            firstCall: true,
            contexts: null,
            sessionID: "",
            responseLoaded: true,
        }

        this.handleDFResponse = this.handleDFResponse.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({
            messages: this.state.messages.slice(),
            inputValue: event.target.value,  
        });
    }

    handleSubmit(event) {
        if (this.state.inputValue === "" || !this.state.responseLoaded) {
            event.preventDefault();
            return;
        }

        const request = {
            firstCall: this.state.firstCall,
            message: this.state.inputValue, 
            contexts: this.state.contexts,
            sessionID: this.state.sessionID,
        };

        const newMessages = [
            < Message type="user" message={this.state.inputValue}/>,
            < BotMessage handleDFResponse={this.handleDFResponse} request={request}/>
        ];

        this.setState({
            messages: this.state.messages.concat(newMessages),
            inputValue: "",
            responseLoaded: false,
        });

        event.preventDefault();
    }

    handleDFResponse(sessionID, contexts, fulfillmentMessages) {
        if (this.state.firstCall) {
            this.setState({
                sessionID: sessionID,
            });
        }
        if (fulfillmentMessages) {
            console.log(fulfillmentMessages);
            let toDos = Array(0);
            for (let message of fulfillmentMessages) {
                toDos.push(
                    < ToDo 
                        toDo={message.basicCard.formattedText} 
                        deleteItem={()=>{}} 
                        addComment={()=>{}} 
                    />
                );
            }

            const newMessage = < ToDoList toDos={toDos} />
            this.setState({
                messages: this.state.messages.concat(newMessage)
            });
        }
        this.setState({
            firstCall: false,
            contexts: contexts,
            responseLoaded: true,
        });
    }

    render() {
        return(
            <div className="chat-bot">
                <MessageBox messages={this.state.messages}/>
                <form className="input-form" onSubmit={this.handleSubmit}>
                    <input className="input-field" type="text" value={this.state.inputValue} onChange={this.handleChange}/>
                    {/*<input className="send-button" type="submit" value="Send"/>*/}
                </form>
            </div>
        );
    }
}

ReactDOM.render(<ChatBot />, document.getElementById("root"));

