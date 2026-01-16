import { create } from 'zustand';
import { getUserPoints, getPointsHistory } from '../lib/supabase.js';

export const usePointsStore = create((set, get) => ({
  points: {
    totalPoints: 0,
    lifetimePoints: 0,
    level: 1
  },
  pointsHistory: [],
  isLoading: false,
  lastUpdated: null,
  
  // Load user points
  loadPoints: async (walletAddress) => {
    if (!walletAddress) return;
    
    set({ isLoading: true });
    try {
      const pointsData = await getUserPoints(walletAddress);
      set({ 
        points: pointsData,
        lastUpdated: new Date(),
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading points:', error);
      set({ isLoading: false });
    }
  },
  
  // Load points history
  loadPointsHistory: async (walletAddress, limit = 50) => {
    if (!walletAddress) return;
    
    try {
      const history = await getPointsHistory(walletAddress, limit);
      set({ pointsHistory: history });
    } catch (error) {
      console.error('Error loading points history:', error);
    }
  },
  
  // Refresh points (reload from database)
  refreshPoints: async (walletAddress) => {
    await get().loadPoints(walletAddress);
    await get().loadPointsHistory(walletAddress);
  },
  
  // Update points locally (optimistic update)
  updatePoints: (points) => {
    set({ points });
  },
  
  // Reset store
  reset: () => {
    set({
      points: { totalPoints: 0, lifetimePoints: 0, level: 1 },
      pointsHistory: [],
      isLoading: false,
      lastUpdated: null
    });
  }
}));
