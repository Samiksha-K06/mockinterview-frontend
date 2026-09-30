
import { createContext, useContext, useState } from "react";
import api from "../api/axiosConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    async function register(name, email, password) {
        const response = await api.post("/api/auth/register", {
            name,
            email,
            password,
        });

        return response.data;
    }

    async function login(email, password) {
        const response = await api.post("/api/auth/login", {
            email,
            password,
        });

        const data = response.data;

        // Expected AuthResponse properties: token, name, email.
        localStorage.setItem("token", data.token);
        localStorage.setItem(
            "user",
            JSON.stringify({ name: data.name, email: data.email })
        );

        setToken(data.token);
        setUser({ name: data.name, email: data.email });
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{ token, user, register, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}