import React from 'react';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="min-h-screen bg-[#343541] flex flex-col">
      <header className="h-14 border-b border-gray-700 bg-[#343541] flex items-center justify-center">
        <h1 className="text-lg font-medium text-white">AI Data Analysis Chat Bot </h1>
      </header>
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-3xl mx-auto">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}

export default App;
