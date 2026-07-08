import { useContext, useEffect } from 'react';
import { axiosPrivate } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const useAxiosPrivate = () => {
  const auth = useContext(AuthContext);

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization'] && auth?.accessToken) {
          config.headers['Authorization'] = `Bearer ${auth.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
    };
  }, [auth?.accessToken]);

  return axiosPrivate;
};