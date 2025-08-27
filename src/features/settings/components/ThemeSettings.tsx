
import React from 'react';
import { Monitor, Moon, Sun, Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { useTheme } from '../../../context/ThemeContext';

export const ThemeSettings: React.FC = () => {
  const { theme, setTheme, accentColor, setAccentColor, accentColors } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Theme Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center cursor-pointer">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center cursor-pointer">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center cursor-pointer">
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Accent Color
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color)}
                className="relative flex flex-col items-center p-3 rounded-lg border-2 border-transparent hover:border-muted-foreground/20 transition-colors"
                style={{
                  borderColor: accentColor.value === color.value ? `hsl(${color.hsl})` : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full mb-2 shadow-sm"
                  style={{ backgroundColor: `hsl(${color.hsl})` }}
                />
                <span className="text-sm font-medium">{color.name}</span>
                {accentColor.value === color.value && (
                  <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
