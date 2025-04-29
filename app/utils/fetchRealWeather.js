import axios from 'axios';

export const fetchRealWeather = async () => {
  const response = await axios.get('/api/weather');
  return response.data;
};
