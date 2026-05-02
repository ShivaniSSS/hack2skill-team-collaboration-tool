import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata = {
  title: 'TeamSync — Team Collaboration Platform',
  description: 'Real-time team collaboration platform with Kanban boards, meeting notes, chat, and AI-powered insights. Built with Next.js and Firebase.',
  keywords: 'team collaboration, kanban, project management, scrum, meeting notes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
