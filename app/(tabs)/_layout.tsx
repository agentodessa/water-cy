import { Icon } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#0EA5E9"
      minimizeBehavior="automatic"
      sidebarAdaptable
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'drop', selected: 'drop.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dams">
        <Icon sf={{ default: 'square.3.layers.3d', selected: 'square.3.layers.3d.fill' }} />
        <NativeTabs.Trigger.Label>Dams</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trends">
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis.circle.fill' }} />
        <NativeTabs.Trigger.Label>Trends</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }} />
        <NativeTabs.Trigger.Label>Alerts</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calculator">
        <Icon sf={{ default: 'drop.circle', selected: 'drop.circle.fill' }} />
        <NativeTabs.Trigger.Label>Calculator</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="earthquakes">
        <Icon sf={{ default: 'waveform', selected: 'waveform.badge.exclamationmark' }} />
        <NativeTabs.Trigger.Label>Quakes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
