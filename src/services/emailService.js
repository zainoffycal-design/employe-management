import { doc, setDoc, serverTimestamp, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateAvatarUrl } from '../utils/avatarUtils';
import toast from 'react-hot-toast';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import emailjs from '@emailjs/browser';

// Email invitation service using EmailJS (FREE for 200 emails/month)
export const emailService = {
  // Create user invitation without password
  createUserInvitation: async (userData) => {
    try {
      // Generate a unique invitation token
      const invitationToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create user document with invitation status
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

      // Generate a temporary UID for the invitation document
      const tempUid = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store invitation data with temp UID
      await setDoc(doc(db, 'user_invitations', tempUid), {
        email: userData.email,
        invitationToken,
        expiresAt: expiresAt.toISOString(),
        invitedAt: serverTimestamp()
      });
      
      // Store user profile with email as key for easy lookup during activation
      await setDoc(doc(db, 'users', userData.email), userProfile);
      
      // Send invitation email
      await emailService.sendInvitationEmail(userData.email, userData.role, userData.name, invitationToken);
      
      toast.success('User invitation sent successfully!');
      return userProfile;
    } catch (error) {
      console.error('Error creating user invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
      throw error;
    }
  },

  // Send invitation email using EmailJS
  sendInvitationEmail: async (email, role, name, token) => {
    try {
      const invitationLink = `${window.location.origin}/setup-password?email=${encodeURIComponent(email)}&token=${token}`;
      
      // EmailJS configuration
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_nhqq0tw';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_20mrm8m';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'B7oRa4hzxw6In2ccj';

      // Template parameters
      const templateParams = {
        to_email: email,
        to_name: name,
        role: getRoleDisplayName(role),
        invitation_link: invitationLink,
        company_name: 'Task Manager',
        expiry_days: '7'
      };

      // Send email using EmailJS
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

  // Verify invitation token
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

  // Activate user account
  activateUserAccount: async (email, password) => {
    try {
      const auth = getAuth();
      
      // Create Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Get the user profile from email-based storage
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      
      // Create new user document with UID as key (consistent with signup)
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
      
      // Store user with UID as document ID (consistent with signup)
      await setDoc(doc(db, 'users', uid), newUserProfile);
      
      // Delete the email-based user document
      await deleteDoc(userRef);
      
      // Clean up invitation data
      const invitationsRef = collection(db, 'user_invitations');
      const invitationsQuery = query(invitationsRef, where('email', '==', email));
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      for (const doc of invitationsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Sign out the newly created user
      await signOut(auth);
      
      toast.success('Account activated successfully! You can now sign in.');
      return userCredential.user;
    } catch (error) {
      console.error('Error activating user account:', error);
      toast.error('Failed to activate account. Please try again.');
      throw error;
    }
  },

  // Update user status (active/inactive)
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

  // Resend invitation email
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
      
      // Generate new token and expiry
      const newToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Update user document with new token
      await updateDoc(userRef, {
        invitationToken: newToken,
        expiresAt: expiresAt.toISOString(),
        invitedAt: serverTimestamp()
      });
      
      // Update invitation data
      const invitationsRef = collection(db, 'user_invitations');
      const invitationsQuery = query(invitationsRef, where('email', '==', email));
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      for (const doc of invitationsSnapshot.docs) {
        await updateDoc(doc.ref, {
          invitationToken: newToken,
          expiresAt: expiresAt.toISOString(),
          invitedAt: serverTimestamp()
        });
      }
      
      // Send new invitation email
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

// Helper function to generate invitation token
const generateInvitationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to get role display name
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