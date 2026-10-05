import { doc, setDoc, serverTimestamp, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateAvatarUrl } from '../utils/avatarUtils';
import toast from 'react-hot-toast';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import emailjs from '@emailjs/browser';

export const emailService = {
  createUserInvitation: async (userData) => {
    try {
      const invitationToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const userProfile = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || [],
        avatar: generateAvatarUrl(userData.name),
        status: 'invited',
        invitationToken,
        invitedAt: serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
        isActive: false,
        createdAt: serverTimestamp()
      };

      if (userData.role === 'manager' && userData.managerType && 
          (Array.isArray(userData.managerType) ? userData.managerType.length > 0 : userData.managerType)) {
        userProfile.managerType = userData.managerType;
      }

      if (userData.hasCommission) {
        userProfile.hasCommission = true;
        userProfile.commissionPercentage = userData.commissionPercentage || 0;
        userProfile.commissionType = userData.commissionType || 'fixed';
      }

      const tempUid = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      await setDoc(doc(db, 'user_invitations', tempUid), {
        email: userData.email,
        invitationToken,
        expiresAt: expiresAt.toISOString(),
        invitedAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'users', userData.email), userProfile);
      
      await emailService.sendInvitationEmail(userData.email, userData.role, userData.name, invitationToken);
      
      toast.success('User invitation sent successfully!');
      return userProfile;
    } catch (error) {
      console.error('Error creating user invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
      throw error;
    }
  },

  sendInvitationEmail: async (email, role, name, token) => {
    try {
      const invitationLink = `${window.location.origin}/setup-password?email=${encodeURIComponent(email)}&token=${token}`;
      
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_nhqq0tw';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_20mrm8m';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'B7oRa4hzxw6In2ccj';

      const templateParams = {
        to_email: email,
        to_name: name,
        role: getRoleDisplayName(role),
        invitation_link: invitationLink,
        company_name: 'Employee Management System',
        expiry_days: '7'
      };

      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      console.log('Email invitation sent successfully to:', email);
      console.log('EmailJS Response:', response);
      
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  },

  verifyInvitationToken: async (email, token) => {
    try {
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      if (userData.status !== 'invited') {
        throw new Error('User is not in invited status');
      }
      
      if (userData.invitationToken !== token) {
        throw new Error('Invalid invitation token');
      }
      
      const expiresAt = new Date(userData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }
      
      return userData;
    } catch (error) {
      console.error('Error verifying invitation token:', error);
      throw error;
    }
  },

  activateUserAccount: async (email, password) => {
    const auth = getAuth();
    let userCredential;

    try {
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw error;
        }
      }

      const uid = userCredential.user.uid;
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const uidDoc = await getDoc(doc(db, 'users', uid));
        if (uidDoc.exists() && uidDoc.data()?.status === 'active') {
          await signOut(auth);
          throw new Error('This account is already activated. Please sign in.');
        }
        throw new Error('User profile not found. Please contact your administrator.');
      }

      const userData = userDoc.data();

      if (userData.status !== 'invited') {
        await signOut(auth);
        throw new Error('This invitation has already been used. Please sign in.');
      }

      const newUserProfile = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || [],
        avatar: userData.avatar,
        status: 'active',
        isActive: true,
        activatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp()
      };

      if (userData.managerType) {
        newUserProfile.managerType = userData.managerType;
      }

      if (userData.hasCommission) {
        newUserProfile.hasCommission = userData.hasCommission;
        newUserProfile.commissionPercentage = userData.commissionPercentage || 0;
        newUserProfile.commissionType = userData.commissionType || 'fixed';
      }

      // Write the uid profile before cleanup so auth stays valid for Firestore writes.
      await setDoc(doc(db, 'users', uid), newUserProfile);
      await deleteDoc(userRef);

      try {
        const invitationsRef = collection(db, 'user_invitations');
        const invitationsQuery = query(invitationsRef, where('email', '==', email));
        const invitationsSnapshot = await getDocs(invitationsQuery);
        await Promise.all(invitationsSnapshot.docs.map((invitationDoc) => deleteDoc(invitationDoc.ref)));
      } catch (invitationError) {
        console.warn('Could not clean up invitation records:', invitationError);
      }

      await signOut(auth);

      toast.success('Account activated successfully! You can now sign in.');
      return userCredential.user;
    } catch (error) {
      console.error('Error activating user account:', error);
      const message = getActivationErrorMessage(error);
      toast.error(message);
      throw new Error(message);
    }
  },

  updateUserStatus: async (email, status) => {
    try {
      const userRef = doc(db, 'users', email);
      await updateDoc(userRef, {
        status: status,
        isActive: status === 'active',
        updatedAt: serverTimestamp()
      });
      
      toast.success(`User status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
      throw error;
    }
  },

  resendInvitation: async (email) => {
    try {
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      if (userData.status !== 'invited') {
        throw new Error('User is not in invited status');
      }
      
      const newToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await updateDoc(userRef, {
        invitationToken: newToken,
        expiresAt: expiresAt.toISOString(),
        invitedAt: serverTimestamp()
      });
      
      const invitationsRef = collection(db, 'user_invitations');
      const invitationsQuery = query(invitationsRef, where('email', '==', email));
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      await Promise.all(invitationsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          invitationToken: newToken,
          expiresAt: expiresAt.toISOString(),
          invitedAt: serverTimestamp()
        })
      ));
      
      await emailService.sendInvitationEmail(email, userData.role, userData.name, newToken);
      
      toast.success('Invitation resent successfully!');
      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
      throw error;
    }
  }
};

const generateInvitationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getActivationErrorMessage = (error) => {
  const code = error?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in, or use the password from your first activation attempt.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/wrong-password':
      return 'An account already exists with a different password. Contact your administrator to resend the invitation.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'permission-denied':
      return 'Could not save your account. Please try again or contact your administrator.';
    default:
      return error?.message || 'Failed to activate account. Please try again.';
  }
};

const getRoleDisplayName = (role) => {
  switch (role) {
    case 'super_manager': return 'Super Manager';
    case 'manager': return 'Manager';
    case 'designer': return 'Designer';
    case 'developer': return 'Developer';
    case 'bd': return 'Business Developer';
    default: return role;
  }
}; 