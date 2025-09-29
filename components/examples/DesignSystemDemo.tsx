"use client"

import React, { useState } from 'react'
import {
  CellButton,
  CellCard,
  CellInput,
  CellSelect,
  CellTextarea,
  CellCheckbox,
  CellRadio,
  CellSwitch,
  CellAlert,
  CellBadge,
  CellProgress,
  CellTooltip,
  CellStack,
  CellGrid,
  FormField,
} from '../ui'

export default function DesignSystemDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
    notifications: true,
    theme: 'light',
    autoSave: false,
  })
  
  const [showAlert, setShowAlert] = useState(true)
  const [progress, setProgress] = useState(65)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-2">Design System Demo</h1>
        <p className="text-gray-600">Comprehensive showcase of the Manifold design system components</p>
      </div>

      {/* Buttons */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Buttons</h2>
        <CellStack direction="horizontal" spacing="md" align="center" wrap>
          <CellButton variant="primary">Primary</CellButton>
          <CellButton variant="secondary">Secondary</CellButton>
          <CellButton variant="accent">Accent</CellButton>
          <CellButton variant="danger">Danger</CellButton>
          <CellButton variant="ghost">Ghost</CellButton>
          <CellButton variant="primary" size="sm">Small</CellButton>
          <CellButton variant="primary" size="lg">Large</CellButton>
          <CellButton variant="primary" disabled>Disabled</CellButton>
        </CellStack>
      </CellCard>

      {/* Form Components */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Form Components</h2>
        
        <CellGrid cols={2} gap="lg">
          <CellStack spacing="md">
            <FormField 
              label="Name" 
              helper="Enter your full name"
              required
            >
              <CellInput
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
              />
            </FormField>

            <FormField label="Email">
              <CellInput
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </FormField>

            <FormField label="Role">
              <CellSelect
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Select your role"
              >
                <option value="admin">Administrator</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </CellSelect>
            </FormField>

            <FormField label="Bio">
              <CellTextarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </FormField>
          </CellStack>

          <CellStack spacing="md">
            <h3 className="font-bold text-lg">Preferences</h3>
            
            <CellCheckbox
              label="Enable Notifications"
              description="Receive email notifications for important updates"
              checked={formData.notifications}
              onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
            />

            <CellSwitch
              label="Auto-save"
              description="Automatically save your work"
              checked={formData.autoSave}
              onChange={(e) => setFormData({...formData, autoSave: e.target.checked})}
            />

            <div>
              <h4 className="font-medium mb-3">Theme Preference</h4>
              <CellStack spacing="sm">
                <CellRadio
                  label="Light Theme"
                  name="theme"
                  value="light"
                  checked={formData.theme === 'light'}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                />
                <CellRadio
                  label="Dark Theme"
                  name="theme"
                  value="dark"
                  checked={formData.theme === 'dark'}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                />
                <CellRadio
                  label="Auto"
                  name="theme"
                  value="auto"
                  checked={formData.theme === 'auto'}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                />
              </CellStack>
            </div>
          </CellStack>
        </CellGrid>

        <div className="mt-6 flex justify-end">
          <CellButton variant="primary" size="lg">
            Save Settings
          </CellButton>
        </div>
      </CellCard>

      {/* Feedback Components */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Feedback Components</h2>
        
        <CellStack spacing="lg">
          {/* Alerts */}
          <div>
            <h3 className="font-bold mb-3">Alerts</h3>
            <CellStack spacing="md">
              {showAlert && (
                <CellAlert 
                  variant="success" 
                  title="Success!"
                  dismissible
                  onDismiss={() => setShowAlert(false)}
                >
                  Your settings have been saved successfully.
                </CellAlert>
              )}
              
              <CellAlert variant="info" title="Information">
                This is an informational message to help users understand the current state.
              </CellAlert>
              
              <CellAlert variant="warning" title="Warning">
                Please review your settings before proceeding.
              </CellAlert>
              
              <CellAlert variant="error" title="Error">
                There was an error processing your request. Please try again.
              </CellAlert>
            </CellStack>
          </div>

          {/* Badges */}
          <div>
            <h3 className="font-bold mb-3">Badges</h3>
            <CellStack direction="horizontal" spacing="md" align="center" wrap>
              <CellBadge variant="default">Default</CellBadge>
              <CellBadge variant="success">Success</CellBadge>
              <CellBadge variant="warning">Warning</CellBadge>
              <CellBadge variant="error">Error</CellBadge>
              <CellBadge variant="info">Info</CellBadge>
              <CellBadge variant="accent">Accent</CellBadge>
              <CellBadge variant="success" size="sm">Small</CellBadge>
              <CellBadge variant="success" size="lg">Large</CellBadge>
              <CellBadge variant="success" rounded>Rounded</CellBadge>
            </CellStack>
          </div>

          {/* Progress */}
          <div>
            <h3 className="font-bold mb-3">Progress Indicators</h3>
            <CellStack spacing="md">
              <CellProgress 
                value={progress} 
                max={100}
                showLabel
                label="Upload Progress"
                variant="success"
              />
              
              <CellProgress 
                value={30} 
                max={100}
                variant="warning"
                animated
              />
              
              <CellProgress 
                value={75} 
                max={100}
                variant="info"
              />
              
              <div className="flex gap-2">
                <CellButton 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10
                </CellButton>
                <CellButton 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10
                </CellButton>
              </div>
            </CellStack>
          </div>
        </CellStack>
      </CellCard>

      {/* Interactive Elements */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Interactive Elements</h2>
        
        <CellStack direction="horizontal" spacing="md" align="center" wrap>
          <CellTooltip content="This is a helpful tooltip">
            <CellButton variant="secondary">Hover me</CellButton>
          </CellTooltip>
          
          <CellTooltip content="Tooltip on the right" placement="right">
            <CellButton variant="accent">Right tooltip</CellButton>
          </CellTooltip>
          
          <CellTooltip content="Tooltip below" placement="bottom">
            <CellButton variant="ghost">Bottom tooltip</CellButton>
          </CellTooltip>
          
          <CellTooltip content="Tooltip on the left" placement="left">
            <CellButton variant="primary">Left tooltip</CellButton>
          </CellTooltip>
        </CellStack>
      </CellCard>

      {/* Layout Examples */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Layout Components</h2>
        
        <CellStack spacing="lg">
          {/* Stack Example */}
          <div>
            <h3 className="font-bold mb-3">Stack Layout</h3>
            <CellStack direction="horizontal" spacing="lg" align="center" justify="between">
              <CellBadge variant="success">Active</CellBadge>
              <span className="text-gray-600">Middle content</span>
              <CellButton variant="primary" size="sm">Action</CellButton>
            </CellStack>
          </div>

          {/* Grid Example */}
          <div>
            <h3 className="font-bold mb-3">Grid Layout</h3>
            <CellGrid cols={4} gap="md">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <CellCard key={item} padding="sm" variant="flat">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                    <p className="text-sm">Item {item}</p>
                  </div>
                </CellCard>
              ))}
            </CellGrid>
          </div>
        </CellStack>
      </CellCard>

      {/* Form State Example */}
      <CellCard padding="lg">
        <h2 className="text-2xl font-bold mb-6">Form State Demo</h2>
        
        <CellStack spacing="md">
          <FormField label="Success State">
            <CellInput
              value="Success value"
              variant="success"
              placeholder="This input is valid"
            />
          </FormField>
          
          <FormField label="Error State" error="This field is required">
            <CellInput
              value=""
              variant="error"
              placeholder="This input has an error"
            />
          </FormField>
          
          <FormField 
            label="Input with Helper" 
            helper="This is helpful information about the field"
          >
            <CellInput
              placeholder="Enter some text"
            />
          </FormField>
        </CellStack>
      </CellCard>
    </div>
  )
}
