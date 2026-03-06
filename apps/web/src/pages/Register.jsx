import { useEffect } from "react"
import { usePageStore } from "../stores/index.js"

// Register utilise le même composant Login en mode register
export default function Register() {
  const { setPage } = usePageStore()
  // On redirige vers Login qui gère les deux modes
  useEffect(() => { setPage("login") }, [])
  return null
}
