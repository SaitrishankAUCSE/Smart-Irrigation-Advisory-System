import { db } from '../firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export function toDate(ts) {
  return ts && ts.toDate ? ts.toDate() : ts ? new Date(ts) : new Date();
}

export async function getFields(userId) {
  try {
    const q = query(collection(db, 'fields'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localStorage.setItem('agrisense_fields', JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    return JSON.parse(localStorage.getItem('agrisense_fields') || '[]');
  }
}

export async function addField(fieldData) {
  try {
    const docRef = await addDoc(collection(db, 'fields'), {
      ...fieldData,
      created_at: serverTimestamp()
    });
    const newField = { id: docRef.id, ...fieldData, created_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('agrisense_fields') || '[]');
    localStorage.setItem('agrisense_fields', JSON.stringify([...existing, newField]));
    return newField;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    const newField = { id: `local_${Date.now()}`, ...fieldData, created_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('agrisense_fields') || '[]');
    localStorage.setItem('agrisense_fields', JSON.stringify([...existing, newField]));
    return newField;
  }
}

export async function getField(fieldId) {
  try {
    const docRef = doc(db, 'fields', fieldId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      localStorage.setItem(`agrisense_field_${fieldId}`, JSON.stringify(data));
      return data;
    } else {
      return null;
    }
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    const specific = localStorage.getItem(`agrisense_field_${fieldId}`);
    if (specific) return JSON.parse(specific);
    const all = JSON.parse(localStorage.getItem('agrisense_fields') || '[]');
    return all.find(f => f.id === fieldId) || null;
  }
}

export async function getMoistureReadings(fieldId) {
  try {
    const q = query(collection(db, `fields/${fieldId}/moistureReadings`), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localStorage.setItem(`agrisense_moisture_${fieldId}`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    return JSON.parse(localStorage.getItem(`agrisense_moisture_${fieldId}`) || '[]');
  }
}

export async function addMoistureReading(fieldId, data) {
  try {
    const docRef = await addDoc(collection(db, `fields/${fieldId}/moistureReadings`), {
      ...data, created_at: serverTimestamp()
    });
    const newReading = { id: docRef.id, ...data, created_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(`agrisense_moisture_${fieldId}`) || '[]');
    localStorage.setItem(`agrisense_moisture_${fieldId}`, JSON.stringify([newReading, ...existing]));
    return newReading;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    const newReading = { id: `local_${Date.now()}`, ...data, created_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(`agrisense_moisture_${fieldId}`) || '[]');
    localStorage.setItem(`agrisense_moisture_${fieldId}`, JSON.stringify([newReading, ...existing]));
    return newReading;
  }
}

export async function getIrrigationLogs(fieldId) {
  try {
    const q = query(collection(db, `fields/${fieldId}/irrigationLogs`), orderBy('logged_at', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localStorage.setItem(`agrisense_irrigation_${fieldId}`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    return JSON.parse(localStorage.getItem(`agrisense_irrigation_${fieldId}`) || '[]');
  }
}

export async function addIrrigationLog(fieldId, data) {
  try {
    const docRef = await addDoc(collection(db, `fields/${fieldId}/irrigationLogs`), {
      ...data, logged_at: serverTimestamp()
    });
    const newLog = { id: docRef.id, ...data, logged_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(`agrisense_irrigation_${fieldId}`) || '[]');
    localStorage.setItem(`agrisense_irrigation_${fieldId}`, JSON.stringify([newLog, ...existing]));
    return newLog;
  } catch (err) {
    console.warn('Firestore unavailable, using localStorage', err);
    const newLog = { id: `local_${Date.now()}`, ...data, logged_at: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(`agrisense_irrigation_${fieldId}`) || '[]');
    localStorage.setItem(`agrisense_irrigation_${fieldId}`, JSON.stringify([newLog, ...existing]));
    return newLog;
  }
}

export async function logUserAction(userId, action, details) {
  try {
    await addDoc(collection(db, 'user_actions'), {
      user_id: userId, action, details, created_at: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not log user action', err);
  }
}
