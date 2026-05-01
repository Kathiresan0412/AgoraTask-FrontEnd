"use client";

import React, { useState, useRef } from 'react';
import { Camera, Save, Lock, Eye, EyeOff, User, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';

export function SettingsPanel() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const roleBadgeColor =
    user.role === 'admin'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : user.role === 'provider'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await api.put('/users/profile', { name: name.trim(), profileImage });
      updateProfile(name.trim(), profileImage);
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put('/users/password', { currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">{t('profile.title')}</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#171717] dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-400" />
            {t('profile.personalInfo')}
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <div className="relative group shrink-0">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-neutral-400" />
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-[#171717] dark:bg-white text-white dark:text-[#171717] p-2 rounded-full shadow-lg hover:scale-110 transition-transform" title="Change photo">
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="text-center sm:text-left">
              <p className="text-xl font-bold text-[#171717] dark:text-white">{user.name}</p>
              <p className="text-sm text-neutral-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
              <span className={`inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1 rounded-full ${roleBadgeColor}`}>
                <Shield className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#171717] dark:text-neutral-300 mb-2">{t('profile.displayName')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-full border-0 py-3 px-5 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-sm transition-all" placeholder="Your display name" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-400 mb-2">{t('profile.emailReadOnly')}</label>
            <input type="email" value={user.email} disabled className="block w-full rounded-full border-0 py-3 px-5 text-neutral-400 bg-neutral-100 dark:bg-neutral-800 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700 text-sm cursor-not-allowed" />
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" /> {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
            </div>
          )}

          <button onClick={handleSaveProfile} disabled={isSavingProfile} className="inline-flex items-center gap-2 bg-[#171717] dark:bg-white text-white dark:text-[#171717] px-7 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-black dark:hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSavingProfile ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-[#171717] border-t-transparent" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>

        {/* Password Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#171717] dark:text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-neutral-400" />
            {t('profile.changePassword')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-neutral-300 mb-2">{t('profile.currentPassword')}</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="block w-full rounded-full border-0 py-3 pl-5 pr-12 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-sm transition-all" placeholder={t('profile.currentPasswordPlaceholder')} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-neutral-300 mb-2">{t('profile.newPassword')}</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full rounded-full border-0 py-3 pl-5 pr-12 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-sm transition-all" placeholder={t('profile.newPasswordPlaceholder')} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-neutral-300 mb-2">{t('profile.confirmNewPassword')}</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full rounded-full border-0 py-3 pl-5 pr-12 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-sm transition-all" placeholder={t('profile.confirmPasswordPlaceholder')} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {newPassword.length > 0 && (
            <div className="mt-4">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= i * 2 ? newPassword.length >= 8 ? 'bg-green-500' : 'bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                ))}
              </div>
              <p className="text-xs text-neutral-400">{newPassword.length < 6 ? t('profile.strengthTooShort') : newPassword.length < 8 ? t('profile.strengthFair') : t('profile.strengthStrong')}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 mt-4">
              <CheckCircle className="w-4 h-4 shrink-0" /> {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
            </div>
          )}

          <button onClick={handleChangePassword} disabled={isSavingPassword} className="inline-flex items-center gap-2 mt-6 bg-[#171717] dark:bg-white text-white dark:text-[#171717] px-7 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-black dark:hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSavingPassword ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-[#171717] border-t-transparent" /> : <Lock className="w-4 h-4" />}
            {t('profile.updatePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
