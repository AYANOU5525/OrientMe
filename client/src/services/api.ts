import axios from 'axios';
import { ApiResponse, ProfilComplet } from '../types';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

export async function soumettreOrientation(profil: Omit<ProfilComplet, 'prenom' | 'autreCompetence'>): Promise<ApiResponse> {
  const response = await api.post<ApiResponse>('/orientation', profil);
  return response.data;
}

export async function getDemo(): Promise<ApiResponse> {
  const response = await api.get<ApiResponse>('/demo');
  return response.data;
}
