import { redirect } from 'next/navigation'

// Customer home is handled by the main page at root
export default function CustomerHomePage() {
  redirect('/')
}
