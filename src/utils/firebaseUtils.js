
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const firebaseUtils = {
  async createDocument(collectionName, data) {
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  },

  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  },

  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      throw error;
    }
  },

  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  },

  async getDocuments(collectionName, queryConstraints = []) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  },

  subscribeToCollection(collectionName, callback, queryConstraints = []) {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(documents);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
    });
  },

  async createUser(userData) {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: userData.avatar,
      isActive: true,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    return userCredential.user;
  },

  async ensureUserUid(uid, email) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.uid) {
          await updateDoc(userRef, { uid: uid });
        }
      } else {
        const emailUserRef = doc(db, 'users', email);
        const emailUserDoc = await getDoc(emailUserRef);
        
        if (emailUserDoc.exists()) {
          const userData = emailUserDoc.data();
          await setDoc(doc(db, 'users', uid), {
            ...userData,
            uid: uid
          });
          await deleteDoc(emailUserRef);
        }
      }
    } catch (error) {
      console.error('Error ensuring user UID:', error);
    }
  },

  async signIn(email, password) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async resetPassword(email) {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
  },

  async signUp(email, password, name) {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, {
      displayName: name
    });

    return userCredential.user;
  },

  async signOut() {
    const auth = getAuth();
    await signOut(auth);
  },

  onAuthStateChanged: (callback) => {
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  },

  async uploadImage(file, path) {
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image size must be less than 2MB');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  },

  async deleteImage(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};

export const queryBuilders = {
  where: (field, operator, value) => where(field, operator, value),
  orderBy: (field, direction = 'desc') => orderBy(field, direction),
  
  byManager: (managerId) => [
    where('managerId', '==', managerId),
    orderBy('createdAt', 'desc')
  ],
  
  byTeamMember: (userId) => [
    where('teamMembers', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  ],
  
  byStatus: (status) => [
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  ],
  
  byAssignee: (assigneeId) => [
    where('assignee', 'array-contains', assigneeId),
    orderBy('createdAt', 'desc')
  ]
};
