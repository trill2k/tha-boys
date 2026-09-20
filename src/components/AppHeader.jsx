import { supabase } from '../lib/supabase'
import Brand from './Brand'

function AppHeader({ playerName }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="app-header">
      <Brand />

      <button
        className="profile-button"
        type="button"
        onClick={handleLogout}
        title="Sign out"
      >
        {playerName
          .charAt(0)
          .toUpperCase()}
      </button>
    </header>
  )
}

export default AppHeader