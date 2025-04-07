import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
                .then((res) => {
                  if (!res.ok) {
                    throw new Error('Failed to fetch user data');
                  }
                  return res.json();
                })
                .then((data) => setUser(data.user))
                .catch((error) => {
                  console.error(error);
                  localStorage.removeItem('token');
                  setUser(null);
                });
        } else {
            setUser(null);
        }
    }, []);
    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
              return data.message;
            }
            localStorage.setItem('token', data.token);
      
            const userResponse = await fetch(`${BACKEND_URL}/user/me`, {
              headers: {
                'Authorization': `Bearer ${data.token}`
              }
            });
            if (!userResponse.ok) {
              localStorage.removeItem('token');
              return 'Failed to fetch user details';
            }
            const userData = await userResponse.json();
            setUser(userData.user);
      
            navigate('/profile');
          } catch (error) {
            console.error(error);
            return 'Invalid credentials';
          }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) {
              return data.message;
            }
            navigate('/');
          } catch (error) {
            console.error(error);
            return 'User Name already exists';
          }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
