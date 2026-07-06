import apiClient from './client';

export const getDistricts = async () => {
  const response = await apiClient.get('/records/districts/');
  return response.data;
};

export const getLatestRisk = async (district) => {
  const params = district ? { district } : {};
  const response = await apiClient.get('/predictions/latest-risk/', { params });
  return response.data;
};

export const getPredictions = async (district) => {
  const params = district ? { district } : {};
  const response = await apiClient.get('/predictions/', { params });
  return response.data;
};

export const runPrediction = async (district) => {
  const response = await apiClient.post('/predictions/run/', { district });
  return response.data;
};

export const getRecords = async (district) => {
  const params = district ? { district } : {};
  const response = await apiClient.get('/records/', { params });
  return response.data;
};

export const getAlerts = async (district) => {
  const params = district ? { district } : {};
  const response = await apiClient.get('/alerts/', { params });
  return response.data;
};

export const acknowledgeAlert = async (id) => {
  const response = await apiClient.patch(`/alerts/${id}/`, { acknowledged: true });
  return response.data;
};