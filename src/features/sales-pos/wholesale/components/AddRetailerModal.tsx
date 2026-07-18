import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2, Mail, MapPin, Phone, UserRound, X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { UseWholesaleCreate } from '../hooks/useWholesaleCreate';

export function AddRetailerModal({ create }: { create: UseWholesaleCreate }) {
  const {
    addRetailerOpen,
    setAddRetailerOpen,
    retailerForm,
    updateRetailerForm,
    retailerFormBusy,
    retailerFormError,
    createRetailer,
  } = create;

  const close = () => {
    if (!retailerFormBusy) setAddRetailerOpen(false);
  };

  return (
    <Modal visible={addRetailerOpen} animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalHead}>
          <View style={styles.addRetailerHeading}>
            <View style={styles.addRetailerHeadingIcon}>
              <UserRound color={colors.accentPrimary} size={22} />
            </View>
            <View>
              <Text style={styles.modalTitle}>Add Retailer</Text>
              <Text style={styles.modalSub}>Create and assign to this order</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.addRetailerContent}
          keyboardShouldPersistTaps="handled"
        >
          <RetailerField
            label="Retailer name"
            required
            icon={<UserRound color={colors.accentPrimary} size={17} />}
            value={retailerForm.name}
            placeholder="Enter retailer name"
            onChangeText={(value) => updateRetailerForm('name', value)}
          />
          <RetailerField
            label="Phone"
            required
            icon={<Phone color={colors.accentPrimary} size={17} />}
            value={retailerForm.phone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            onChangeText={(value) => updateRetailerForm('phone', value)}
          />
          <RetailerField
            label="Email"
            icon={<Mail color={colors.accentPrimary} size={17} />}
            value={retailerForm.email}
            placeholder="Email address (optional)"
            keyboardType="email-address"
            onChangeText={(value) => updateRetailerForm('email', value)}
          />
          <RetailerField
            label="City"
            icon={<Building2 color={colors.accentPrimary} size={17} />}
            value={retailerForm.city}
            placeholder="City (optional)"
            onChangeText={(value) => updateRetailerForm('city', value)}
          />
          <RetailerField
            label="Address"
            icon={<MapPin color={colors.accentPrimary} size={17} />}
            value={retailerForm.address}
            placeholder="Full address (optional)"
            multiline
            onChangeText={(value) => updateRetailerForm('address', value)}
          />

          {retailerFormError ? (
            <View style={styles.addRetailerError}>
              <Text style={styles.errorText}>{retailerFormError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.modalFooter}>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.backStepButton}
              disabled={retailerFormBusy}
              onPress={close}
            >
              <Text style={styles.backStepText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Button
                title="Add & Assign Retailer"
                loading={retailerFormBusy}
                disabled={!retailerForm.name.trim() || !retailerForm.phone.trim()}
                onPress={() => void createRetailer()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RetailerField({
  label,
  required,
  icon,
  multiline,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.addRetailerField}>
      <Text style={styles.addRetailerLabel}>
        {label}
        {required ? <Text style={{ color: colors.statusError }}> *</Text> : null}
      </Text>
      <View style={[styles.addRetailerInputWrap, multiline && styles.addRetailerInputMultiline]}>
        <View style={styles.addRetailerFieldIcon}>{icon}</View>
        <TextInput
          {...inputProps}
          multiline={multiline}
          style={[styles.addRetailerInput, multiline && styles.addRetailerTextArea]}
          placeholderTextColor={colors.textMuted}
          autoCapitalize={inputProps.keyboardType === 'email-address' ? 'none' : 'words'}
        />
      </View>
    </View>
  );
}
