import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

const ALERTS_COLLECTION = 'userAlerts';

// Get all alerts for a specific user
export const getUserAlerts = async (userId) => {
  try {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const alerts = [];

    querySnapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return alerts;
  } catch (error) {
    console.error('Error getting user alerts:', error);
    throw error;
  }
};

// Add a new alert for a user
export const addUserAlert = async (userId, userEmail, alertData) => {
  try {
    const alertDoc = {
      userId,
      userEmail,
      currency: alertData.currency,
      threshold: parseFloat(alertData.threshold),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, ALERTS_COLLECTION), alertDoc);

    return {
      id: docRef.id,
      ...alertDoc
    };
  } catch (error) {
    console.error('Error adding user alert:', error);
    throw error;
  }
};

// Delete a specific alert
export const deleteUserAlert = async (alertId) => {
  try {
    await deleteDoc(doc(db, ALERTS_COLLECTION, alertId));
    return true;
  } catch (error) {
    console.error('Error deleting user alert:', error);
    throw error;
  }
};

// Get all alerts (for backend processing)
export const getAllAlerts = async () => {
  try {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const alerts = [];

    querySnapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return alerts;
  } catch (error) {
    console.error('Error getting all alerts:', error);
    throw error;
  }
};

// Real-time listener for user alerts
export const subscribeToUserAlerts = (userId, callback) => {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const alerts = [];
    querySnapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(alerts);
  });
};

// Update alert status (activate/deactivate)
export const updateAlertStatus = async (alertId, isActive) => {
  try {
    const alertRef = doc(db, ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, {
      isActive,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
};

// Check if user already has an alert for a specific currency
export const hasAlertForCurrency = async (userId, currency) => {
  try {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('userId', '==', userId),
      where('currency', '==', currency),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking currency alert:', error);
    return false;
  }
};