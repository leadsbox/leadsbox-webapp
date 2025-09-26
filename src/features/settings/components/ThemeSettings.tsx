
import React from 'react';
import { Monitor, Moon, Sun, Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { useTheme } from '../../../context/ThemeContext';
import type { Theme } from '../../../context/ThemeContext';

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
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
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
            {accentColors.map((color) => {
              const isSelected = accentColor.value === color.value;
              return (
                <Button
                  key={color.value}
                  variant="outline"
                  onClick={() => setAccentColor(color)}
                  className={`relative h-auto p-3 flex-col items-center rounded-lg transition-all ${
                    isSelected ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    '--tw-ring-color': `hsl(${color.hsl})`,
                    borderColor: `hsl(${color.hsl} / 0.2)`,
                    backgroundColor: isSelected ? `hsl(${color.hsl} / 0.1)` : undefined,
                  } as React.CSSProperties}
                >
                  <div
                    className="w-8 h-8 rounded-full mb-2 shadow-sm border border-foreground/10"
                    style={{ backgroundColor: `hsl(${color.hsl})` }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
