import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and preferences</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Settings Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings page is temporarily simplified. Please run `npm install` in your project root 
            to create the missing package-lock.json file, then restart your development server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;