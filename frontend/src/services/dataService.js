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

export async function deleteField(fieldId) {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'fields', fieldId));
  } catch (err) {
    console.warn('Firestore delete unavailable, updating localStorage', err);
  }
  const existing = JSON.parse(localStorage.getItem('agrisense_fields') || '[]');
  const updated = existing.filter(f => f.id !== fieldId);
  localStorage.setItem('agrisense_fields', JSON.stringify(updated));
  return true;
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
      user_id: userId || 'anonymous',
      action,
      details,
      created_at: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not log user action', err);
  }
}

export async function saveSimulationRun(userId, simData) {
  try {
    const docRef = await addDoc(collection(db, 'farmer_simulations'), {
      user_id: userId || 'anonymous',
      ...simData,
      created_at: serverTimestamp()
    });
    const record = { id: docRef.id, ...simData, created_at: new Date().toISOString() };
    const history = JSON.parse(localStorage.getItem('agrisense_sim_history') || '[]');
    localStorage.setItem('agrisense_sim_history', JSON.stringify([record, ...history.slice(0, 49)]));
    return record;
  } catch (err) {
    console.warn('Firestore simulation save error, saving locally:', err);
    const record = { id: `local_${Date.now()}`, ...simData, created_at: new Date().toISOString() };
    const history = JSON.parse(localStorage.getItem('agrisense_sim_history') || '[]');
    localStorage.setItem('agrisense_sim_history', JSON.stringify([record, ...history.slice(0, 49)]));
    return record;
  }
}

export async function saveVoiceBroadcastLog(userId, voiceData) {
  try {
    await addDoc(collection(db, 'voice_broadcast_logs'), {
      user_id: userId || 'anonymous',
      ...voiceData,
      created_at: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not log voice broadcast to Firestore:', err);
  }
}

export async function saveIrrigationSession(userId, sessionData) {
  try {
    const docRef = await addDoc(collection(db, 'irrigation_sessions'), {
      user_id: userId || 'anonymous',
      ...sessionData,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...sessionData };
  } catch (err) {
    console.warn('Could not save irrigation session to Firestore:', err);
    return { id: `local_${Date.now()}`, ...sessionData };
  }
}

export async function saveFarmerPreferences(userId, prefs) {
  if (!userId) return;
  try {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'farmer_preferences', userId), {
      ...prefs,
      updated_at: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save farmer preferences to Firestore:', err);
  }
}
