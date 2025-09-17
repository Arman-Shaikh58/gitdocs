import { createContext, useContext, useState, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleCheckBig, AlertTriangle, Info } from "lucide-react"
import clsx from "clsx"

type Variant = "default" | "destructive" | "success"

interface AlertData {
  message: string
  title?: string
  variant: Variant
  visible: boolean
}

interface AlertContextType {
  showAlert: (opts: { message: string; title?: string; variant?: Variant }) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState<AlertData>({
    message: "",
    title: "",
    variant: "default",
    visible: false,
  })

  const [animateOut, setAnimateOut] = useState(false)
  const [show, setShow] = useState(false)

  const showAlert = useCallback(
    ({ message, title = "Notice", variant = "default" }: { message: string; title?: string; variant?: Variant }) => {
      setAlert({ message, title, variant, visible: true })
      setShow(true)
      setAnimateOut(false)

      setTimeout(() => {
        setAnimateOut(true) // 🔁 trigger exit animation
        setTimeout(() => {
          setShow(false) // 🔁 unmount after animation ends
        }, 300) // ⏱️ match duration of transition
      }, 4000)
    },
    []
  )

  const getIcon = (variant: Variant) => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CircleCheckBig className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {show && (
        <div
          className={clsx(
            "fixed bottom-4 right-4 max-w-sm z-50 transition-all duration-300",
            animateOut ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
          )}
        >
          <Alert variant={alert.variant} className="shadow-lg">
            {getIcon(alert.variant)}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export const useAlert = () => {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error("useAlert must be used within <AlertProvider>")
  return ctx
}
