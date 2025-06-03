import Navbar from '@/components/home/header/Navbar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full">
      <div className="flex flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default layout