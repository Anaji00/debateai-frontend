// src/components/Header.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authProvider";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-[#202123] border-b border-gray-700 shadow-md">
      <h1
        className="text-xl font-bold text-emerald-400 cursor-pointer"
        onClick={() => navigate("/")}
      >
        Devil’s Advocate AI
      </h1>

      <div className="space-x-4">
        {isAuthenticated ? (
          <>
            <span className="text-white text-sm">👤 {user?.identifier}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-white hover:underline"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm text-white hover:underline"
            >
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
