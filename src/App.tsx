import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import './index.css'
import axios from 'axios'
import copy from 'copy-to-clipboard'
import { toast } from 'react-toastify'

type Message = {
  sender: "you" | "solomon",
  text:string
}
   const copyToClipboard = (text:string) => {
    const isCopy = copy(text);
    if (isCopy) toast.success("Copied to Clipboard")
   };

function App() {
  const [chatToExport, setChatToExport] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCharacter,setCurrentCharacter] = useState<Message["sender"]>("you")
  const [showCharacterPick, setShowCharacterPick] = useState(0)
  const [showHelpModal, setShowHelpModal] = useState(true)
  const [showEmailCollector, setShowEmailCollector] = useState(false)
  const mobile = useCheckMobileScreen()

  const ref = useRef<HTMLInputElement>();
  const scrollRef = useRef<HTMLSpanElement>();

  const openCharacterPicker = useCallback(() => {
    setShowCharacterPick(p=>p+1)
  }, [setShowCharacterPick])

  const closeCharacterPicker = useCallback(() => {
    setShowCharacterPick(2)
  }, [setShowCharacterPick])

  const toggleCharacter = useCallback(() => {
    if (mobile && ref.current) ref.current.blur()
    
    setCurrentCharacter(prev => {
      if (prev === "solomon") return "you"
      
      return "solomon"
    })

    closeCharacterPicker()
    }, [mobile, closeCharacterPicker])
  
  const scrollToNewMessage = () => {
    scrollRef.current?.scrollIntoView({behavior:"smooth"})
  }

  const closeEmailCollector = useCallback(() => { 
    setShowEmailCollector(false)
  },[setShowEmailCollector])

  const closeHelpModal = useCallback(() => { 
    setShowHelpModal(false)
  },[setShowHelpModal])



  const openEmailCollector = useCallback(() => { 
    const emailCollected = localStorage.getItem("emailCollected");

    if (emailCollected === "true") return copyToClipboard(chatToExport)

    setShowEmailCollector(true)
  }, [setShowEmailCollector, chatToExport])
  
  return (
    <main>
      <Header openEmailCollector={ openEmailCollector} disableExport={chatToExport===""} />
      <MessageList scrollToNewMessage={scrollToNewMessage} messages={ messages } ref={ scrollRef } />
      <Input setChatToExport={ setChatToExport } scrollToNewMessage={ scrollToNewMessage } ref={ ref } currentCharacter={ currentCharacter } setMessages={ setMessages }  openCharacterPicker={ openCharacterPicker } toggleCharacter={ toggleCharacter } closeHelpModal={ closeHelpModal } />

      { showCharacterPick===1 && <ChangeCharacter currentCharacter={ currentCharacter } /> }
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

type InputProps= {closeHelpModal:()=>void,setChatToExport:React.Dispatch<React.SetStateAction<string>>,scrollToNewMessage:()=>void, setMessages: React.Dispatch<React.SetStateAction<Message[]>>, openCharacterPicker: () => void, toggleCharacter: () => void,currentCharacter: Message["sender"] }

const Input = forwardRef<HTMLInputElement | unknown, InputProps>(function Input(props, ref) {
  const mobile = useCheckMobileScreen()

  const { closeHelpModal,setMessages, openCharacterPicker, toggleCharacter,  currentCharacter, setChatToExport } = props

  const [text, setText] = useState("")

  const handleSubmit = useCallback(() => {
      closeHelpModal()

      openCharacterPicker()


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

    //@ts-expect-error bleh
    if (mobile && ref.current) ref.current.blur()
  },[text, setMessages, setChatToExport, openCharacterPicker, currentCharacter])

  // PARTE DEL PROBLEMA ESTA ACA 👇
  const onEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    if (text === "") return toggleCharacter()

    return handleSubmit()

  }, [handleSubmit, text, toggleCharacter])
  
  // PARTE DEL PROBLEMA ESTA ACA 👇
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  },[setText])
  
  
  return <div className="input">
    <p onClick={toggleCharacter} className={currentCharacter==="solomon" ? "solomonName" : "youName"}>
    { currentCharacter === "solomon" ? "Solomon" : "You" }
    </p>
    {/* @ts-expect-error ref error */}
    <input key={"test"} type="text"  name="name" ref={ref} autoComplete="off" onKeyDown={onEnter} onChange={handleTextChange} value={text}  />
    <button children={"⬆"} onClick={handleSubmit}/>
  </div>
})

const ChangeCharacter = ({ currentCharacter }: { currentCharacter: Message["sender"]}) => {
  const mobile = useCheckMobileScreen()
  
  return <div className="changeCharacter" >
    { !mobile && <h2 style={{margin:0,marginBottom:15}}>or Press ENTER again</h2> }
    
    <div style={{display:"flex",alignItems:"center"}}>
      <p style={ { fontSize: 32,margin:0 }}>👇</p>
      
      <h2 style={{margin:0}}>
        Click here to change perspective to <span style={{color: currentCharacter !=="solomon"?"#EE964B":"#1B8AFF"}}>{ (currentCharacter !== "solomon" ? "solomon" : "you").toUpperCase() }</span>
      </h2>
    </div>
  </div>
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

      await axios.post("https://server.skilltreesapp.com/api/development/solomon", body)
      localStorage.setItem("emailCollected","true");
    } catch (error) {
      console.log(error)

    } finally {
      copyToClipboard(chatToExport)
      closeEmailCollector()
      setLoading(false)
    }
    
  }

  return <div className="emailCollector">
    <form onSubmit={submitAndCopy}>
      <h1>Export your conversation for free</h1>
    
      <h3>Leave your email so I can keep you updated on other cool projects</h3>

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

const useCheckMobileScreen = () => {
    const [width, setWidth] = useState(window.innerWidth);
    const handleWindowSizeChange = () => {
            setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    return (width <= 768);
}