import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import './index.css'
import axios from 'axios'

type Message = {
  sender: "you" | "solomon",
  text:string
}

function App() {
  const [chatToExport, setChatToExport] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCharacter,setCurrentCharacter] = useState<Message["sender"]>("you")
  const [showCharacterPick, setShowCharacterPick] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(true)
  const [showEmailCollector, setShowEmailCollector] = useState(false)

  const ref = useRef<HTMLInputElement>();
  const scrollRef = useRef<HTMLSpanElement>();

  const openCharacterPicker = useCallback(() => {
    setShowCharacterPick(true)
  }, [setShowCharacterPick])

  const closeCharacterPicker = useCallback(() => {
    setShowCharacterPick(false)
    if(ref.current)ref.current.focus()
  }, [setShowCharacterPick])

    const toggleCharacter = useCallback(() => {
    setCurrentCharacter(prev => {
      if (prev === "solomon") return "you"
      
      return "solomon"
    })

    closeCharacterPicker()
  },[setCurrentCharacter,closeCharacterPicker])

  const scrollToNewMessage = () => {
    scrollRef.current?.scrollIntoView({behavior:"smooth"})
  }

  const closeEmailCollector = useCallback(() => { 
    setShowEmailCollector(false)
  },[setShowEmailCollector])

  const closeHelpModal = useCallback(() => { 
    setShowHelpModal(false)
  },[setShowHelpModal])

  const openEmailCollector = useCallback(async () => { 
    const emailCollected = localStorage.getItem("emailCollected");

    if (emailCollected === "true") {
      await navigator.clipboard.writeText(chatToExport)

      alert("Chat copied to clipboard!")
      return 
    }

    setShowEmailCollector(true)
  },[setShowEmailCollector,chatToExport])

  return (
    <main>
      <Header openEmailCollector={ openEmailCollector} disableExport={chatToExport===""} />
      <MessageList scrollToNewMessage={scrollToNewMessage} messages={ messages } ref={ scrollRef } />
      <Input setChatToExport={ setChatToExport } scrollToNewMessage={ scrollToNewMessage } ref={ ref } currentCharacter={ currentCharacter } setMessages={ setMessages } closeCharacterPicker={ closeCharacterPicker } openCharacterPicker={ openCharacterPicker } toggleCharacter={ toggleCharacter } closeHelpModal={ closeHelpModal} />
      { showCharacterPick && <ChangeCharacter currentCharacter={ currentCharacter } toggleCharacter={ toggleCharacter } /> }
      { showEmailCollector && <EmailCollector chatToExport={ chatToExport } closeEmailCollector={ closeEmailCollector } />}
      { showHelpModal && <HelpModal />}
    </main>
  )
}

export default App

const MessageList = forwardRef<HTMLSpanElement | unknown, { messages: Message[] ,scrollToNewMessage:()=>void}>(function MessageList({ messages,scrollToNewMessage }, ref) {
    useEffect(() => {
      scrollToNewMessage()
    }, [messages,scrollToNewMessage]);

  return <div className="messageContainer">
    { messages.map((message, idx) => {
      return <div key={ idx } className={message.sender === "solomon" ?"solomonMessage":"userMessage" }>
          {message.text}
      </div>
    }) }
    {/* @ts-expect-error ref error */}
    <span ref={ref}></span>
  </div>
})

type InputProps= {closeHelpModal:()=>void,setChatToExport:React.Dispatch<React.SetStateAction<string>>,scrollToNewMessage:()=>void, setMessages: React.Dispatch<React.SetStateAction<Message[]>>, openCharacterPicker: () => void, toggleCharacter: () => void, closeCharacterPicker: () => void, currentCharacter: Message["sender"] }

const Input = forwardRef<HTMLInputElement|unknown,InputProps>(function Input(props, ref) {
  const { closeHelpModal,setMessages, openCharacterPicker, toggleCharacter, closeCharacterPicker, currentCharacter, setChatToExport } = props

  const [text, setText] = useState("")

  const handleSubmit = useCallback(() => {
    if (text === "") return;

    setMessages(p => {
      return [...p,{sender:currentCharacter,text}]
    })

    const currentDate = new Date() 
    const timeString = currentDate.getDate() + "/"
                + (currentDate.getMonth()+1)  + "/" 
                + currentDate.getFullYear() + " @ "  
                + currentDate.getHours() + ":"  
                + currentDate.getMinutes() + ":" 
                + currentDate.getSeconds();

    setChatToExport(p => {
      return `${p}\n[${timeString}] ${currentCharacter.toUpperCase()}: ${text}`
    })

    setText("")

    openCharacterPicker()
  },[text, setMessages, setChatToExport, openCharacterPicker, currentCharacter])

  const onEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    if(text === "") return toggleCharacter()

    return handleSubmit()
  }, [handleSubmit, text, toggleCharacter])
  
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    closeHelpModal()

    if (e.target.value !== "") {
      closeCharacterPicker()
    } else {
      openCharacterPicker()
    }
    
    setText(e.target.value)
  },[setText,openCharacterPicker,closeCharacterPicker,closeHelpModal])
  
  
  return <div className="input">
    <p className={currentCharacter==="solomon" ? "solomonName" : "youName"}>
    { currentCharacter === "solomon" ? "Solomon" : "You" }
    </p>
    {/* @ts-expect-error ref error */}
    <input type="text" name="name" ref={ref} autoComplete="off" autoFocus onKeyDown={onEnter} onChange={handleTextChange} value={text} />
    <button children={"⬆"} onClick={handleSubmit}/>
  </div>
})

const ChangeCharacter = ({ currentCharacter, toggleCharacter}: { currentCharacter: Message["sender"], toggleCharacter:()=>void }) => {
  return <button className="changeCharacter" onClick={ toggleCharacter }>
    <h2>
    Click here to change perspective to  <span style={{color: currentCharacter !=="solomon"?"#EE964B":"#1B8AFF"}}>{ (currentCharacter !== "solomon" ? "solomon" : "you").toUpperCase() }</span>
    </h2>

    <h2>
    Or press ENTER again
    </h2>    
  </button>
}

const HelpModal = () => {
  return <div className="helpModal">
    <h1>Consider <span style={{color:"#EE964B"}}>Solomon</span> as your 85 old self</h1>
    <h2>He's your best counselor</h2>

    <h3>Why?</h3>
    <ul>
      <li>He is competent </li>
      <li>You two have aligned incentives</li>
      <li>He knows everything about you</li>
    </ul>
    
    <h4>Start talking to him 👇</h4>
  </div>
}

const Header = ({openEmailCollector,disableExport}:{openEmailCollector:()=>void , disableExport:boolean}) => {
  return <div className="header">
    <button children={"Export Conversation"} onClick={openEmailCollector} disabled={disableExport}/>
  </div>
}

const EmailCollector = ({ chatToExport,closeEmailCollector}:{chatToExport:string,closeEmailCollector:()=>void}) => {
  const [loading,setLoading] = useState(false)

  const submitAndCopy = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      setLoading(true)
      e.preventDefault()
      //@ts-expect-error no se
      const data = new FormData(e.target);
      const fields = [...data.entries()] as [string,string][]
      const body : {[key:string]:string} = {}
      fields.forEach(keyValue => {
        const key = keyValue[0]
        body[key] = keyValue[1] 
      })

      await navigator.clipboard.writeText(chatToExport)
      await axios.post("https://server.skilltreesapp.com/api/development/solomon", body)
      localStorage.setItem("emailCollected","true");
    } catch (error) {
      console.log(error)

    } finally {
      alert("Chat copied to clipboard!")
      closeEmailCollector()
      setLoading(false)
    }
    
  }

  return <div className="emailCollector">
    <form onSubmit={submitAndCopy}>
      <h1>Export your conversation for free</h1>
    
      <h3>Leave your email so I can keep you updated on other cool projects (one time ask)</h3>

      <div className="inputPair">
      <label htmlFor="firstName">First Name *</label>
      <input type="text" id="firstName" required name="firstName"/>
      </div>

      <div className="inputPair">
      <label htmlFor="email">Email *</label>
      <input type="email" id="email" required name="email"/>
      </div>
    
      <button disabled={loading}>{loading ? "Loading..." : "Copy my conversation"}</button>
    </form>
  </div>
}