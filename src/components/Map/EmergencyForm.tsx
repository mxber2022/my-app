"use client";

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface EmergencyFormProps {
  onSubmit: (data: EmergencyInfo) => void;
  onClose: () => void;
  isLoading: boolean;
}

export interface EmergencyInfo {
  type: string;
  description: string;
  severity: string;
  peopleAffected: string;
  contactInfo: string;
}

export const EmergencyForm: React.FC<EmergencyFormProps> = ({ onSubmit, onClose, isLoading }) => {
  const [formData, setFormData] = React.useState<EmergencyInfo>({
    type: '',
    description: '',
    severity: 'medium',
    peopleAffected: '',
    contactInfo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-1 bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 rounded-2xl blur-2xl opacity-50"></div>
        <div className="relative bg-card rounded-2xl shadow-xl border p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h2 className="font-display text-xl font-bold tracking-tight">Emergency Details</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1.5 text-sm" htmlFor="type">
                  Emergency Type
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  required
                  placeholder="e.g., Medical, Fire, Natural Disaster"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all text-sm"
                  value={formData.type}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-sm" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  placeholder="Describe the emergency situation..."
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all text-sm"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-sm" htmlFor="severity">
                  Severity Level
                </label>
                <select
                  id="severity"
                  name="severity"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all text-sm"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="low">Low - Non-life-threatening</option>
                  <option value="medium">Medium - Requires Immediate Attention</option>
                  <option value="high">High - Life-threatening</option>
                  <option value="critical">Critical - Mass Casualty</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-sm" htmlFor="peopleAffected">
                  Number of People Affected
                </label>
                <input
                  type="text"
                  id="peopleAffected"
                  name="peopleAffected"
                  required
                  placeholder="e.g., 1-5, 5-10, More than 20"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all text-sm"
                  value={formData.peopleAffected}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-sm" htmlFor="contactInfo">
                  Emergency Contact Information
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  required
                  placeholder="Phone number or contact details"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all text-sm"
                  value={formData.contactInfo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-input hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? "Publishing..." : "Publish Emergency"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};