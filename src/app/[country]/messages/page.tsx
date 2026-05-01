import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Search, Send, MoreVertical, Phone, Video, Paperclip } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 outline-none">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden container mx-auto max-w-7xl py-6 px-4">
        <div className="bg-white dark:bg-slate-900 w-full flex rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden shadow-slate-200/40 dark:shadow-none">
          
          {/* Chat List */}
          <aside className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-4">Messages</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input type="text" className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full" placeholder="Search chats..."/>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Active Chat Item */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 cursor-pointer">
                <div className="relative shrink-0">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="avatar" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"/>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm truncate">Colombo Cleaners</h4>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">10:42 AM</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Yes, our team will arrive tomorrow at 10 AM.</p>
                </div>
              </div>

              {/* Read Chat Item */}
              <div className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors border-l-4 border-transparent">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 border border-slate-300 dark:border-slate-700 shadow-sm">SP</div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm truncate">Support Admin</h4>
                    <span className="text-xs text-slate-400">Yesterday</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">How can we help you with your booking issue?</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Active Chat Window */}
          <main className="hidden md:flex flex-1 flex-col bg-slate-50 dark:bg-slate-950/50 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0 mix-blend-overlay"></div>
            
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"/>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Colombo Cleaners</h3>
                  <p className="text-xs text-green-500 font-bold">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <Phone className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition-colors"/>
                <Video className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition-colors"/>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800"></div>
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-600 transition-colors"/>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 flex flex-col">
              <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider my-4">Today</div>
              
              {/* Other message */}
              <div className="flex items-end gap-2 max-w-md">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="avatar" className="w-8 h-8 rounded-full shadow-sm object-cover shrink-0"/>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-sm">Hello! We received your booking for the Deep House Cleaning service.</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">10:35 AM</span>
                </div>
              </div>

              {/* My message */}
              <div className="flex items-end gap-2 max-w-md self-end flex-row-reverse">
                <div className="bg-indigo-600 text-white p-3.5 rounded-2xl rounded-br-sm shadow-md">
                  <p className="text-sm">Hi! Yes, that's correct. I wanted to confirm if you bring all the necessary cleaning supplies?</p>
                  <span className="text-[10px] text-indigo-200 mt-1 block text-right font-medium">10:38 AM</span>
                </div>
              </div>
              
               {/* Other message */}
               <div className="flex items-end gap-2 max-w-md">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="avatar" className="w-8 h-8 rounded-full shadow-sm object-cover shrink-0"/>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-sm">Yes, our team will arrive tomorrow at 10 AM with all equipment and supplies included.</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">10:42 AM</span>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-full border border-slate-200 dark:border-slate-700">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700 active:scale-95">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="text" className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400" placeholder="Type your message..."/>
                <button className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors rounded-full shadow-md active:scale-95">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
