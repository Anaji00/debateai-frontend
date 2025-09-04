import React from "react";

type HeaderBannerProps = {
  user?: string;
};

const HeaderBanner: React.FC<HeaderBannerProps> = ({ user }) => {
  return (
    <div className="bg-black border-b border-gray-700 px-8 py-4 flex justify-between items-center text-white">
      <h1 className="text-xl font-bold m-0">Devils Advocate AI</h1>
      {user && (
        <span className="text-sm text-gray-300">
          Logged in as: {user}
        </span>
      )}
    </div>
  );
};

export default HeaderBanner;
