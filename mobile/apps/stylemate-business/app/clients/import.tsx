import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useClientImport } from '@stylemate/core/hooks/useBusinessApi';
import type { ImportClientRow, InvalidClientRow, DuplicateClientRow, ImportJobStatus } from '@stylemate/core/services/businessApi';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const EXPECTED_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'phone', label: 'Phone Number', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'gender', label: 'Gender', required: false },
  { key: 'birthday', label: 'Birthday', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  
  return { headers, rows };
}

function autoMatchColumn(csvColumn: string): string | null {
  const normalized = csvColumn.toLowerCase().replace(/[^a-z]/g, '');
  
  const mappings: Record<string, string[]> = {
    firstName: ['firstname', 'first', 'fname', 'givenname'],
    lastName: ['lastname', 'last', 'lname', 'surname', 'familyname'],
    phone: ['phone', 'mobile', 'cell', 'telephone', 'phonenumber', 'contact'],
    email: ['email', 'emailaddress', 'mail'],
    gender: ['gender', 'sex'],
    birthday: ['birthday', 'dob', 'dateofbirth', 'birthdate'],
    notes: ['notes', 'comments', 'remarks', 'memo'],
  };
  
  for (const [field, aliases] of Object.entries(mappings)) {
    if (aliases.includes(normalized)) {
      return field;
    }
  }
  return null;
}

export default function ClientImportScreen() {
  const router = useRouter();
  const { validateImport, startImport, getImportStatus, isValidating, isImporting } = useClientImport();

  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{
    valid: ImportClientRow[];
    invalid: InvalidClientRow[];
    duplicates: DuplicateClientRow[];
  } | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportJobStatus | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [sendWelcome, setSendWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<'valid' | 'errors' | 'duplicates'>('valid');
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const parsed = parseCSV(content);

      if (parsed.headers.length === 0) {
        Alert.alert('Error', 'Could not parse CSV file. Please check the format.');
        return;
      }

      setCsvData(parsed);
      
      const autoMapping: Record<string, string> = {};
      parsed.headers.forEach(header => {
        const matched = autoMatchColumn(header);
        if (matched) {
          autoMapping[header] = matched;
        }
      });
      setColumnMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to read file. Please try again.');
    }
  };

  const handleValidate = async () => {
    if (!csvData) return;

    const result = await validateImport(columnMapping, csvData.rows);
    if (result.success && result.result) {
      setValidationResult({
        valid: result.result.valid,
        invalid: result.result.invalid,
        duplicates: result.result.duplicates,
      });
      setStep('preview');
    } else {
      Alert.alert('Validation Error', result.error || 'Failed to validate data');
    }
  };

  const handleStartImport = async () => {
    if (!validationResult) return;

    const clientsToImport = validationResult.valid;
    if (clientsToImport.length === 0) {
      Alert.alert('No Valid Data', 'There are no valid clients to import.');
      return;
    }

    const result = await startImport({
      clients: clientsToImport,
      skipDuplicates,
      sendWelcomeMessage: sendWelcome,
    });

    if (result.success && result.jobId) {
      setImportJobId(result.jobId);
      setStep('importing');
      startPollingStatus(result.jobId);
    } else {
      Alert.alert('Import Error', result.error || 'Failed to start import');
    }
  };

  const startPollingStatus = (jobId: string) => {
    pollInterval.current = setInterval(async () => {
      const result = await getImportStatus(jobId);
      if (result.success && result.status) {
        setImportStatus(result.status);
        if (result.status.status === 'completed' || result.status.status === 'failed') {
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
          }
          setStep('complete');
        }
      }
    }, 2000);
  };

  const handleMappingSelect = (csvColumn: string, targetField: string | null) => {
    setColumnMapping(prev => {
      const updated = { ...prev };
      if (targetField) {
        Object.keys(updated).forEach(key => {
          if (updated[key] === targetField) {
            delete updated[key];
          }
        });
        updated[csvColumn] = targetField;
      } else {
        delete updated[csvColumn];
      }
      return updated;
    });
    setShowMappingModal(false);
    setSelectedColumn(null);
  };

  const requiredFieldsMapped = ['firstName', 'lastName', 'phone'].every(
    field => Object.values(columnMapping).includes(field)
  );

  const downloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'A CSV template with the following columns will be created:\nFirst Name, Last Name, Phone, Email, Gender, Birthday, Notes',
      [{ text: 'OK' }]
    );
  };

  const renderUploadStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.uploadArea}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadTitle}>Import Clients from CSV</Text>
        <Text style={styles.uploadDescription}>
          Upload a CSV file with your client data. We'll help you map the columns and validate the data before importing.
        </Text>

        <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.uploadButtonGradient}
          >
            <Text style={styles.uploadButtonText}>Choose CSV File</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
          <Text style={styles.templateButtonText}>Download Template</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Required Fields</Text>
        <Text style={styles.infoItem}>• First Name</Text>
        <Text style={styles.infoItem}>• Last Name</Text>
        <Text style={styles.infoItem}>• Phone Number</Text>
        
        <Text style={[styles.infoTitle, { marginTop: SPACING.lg }]}>Optional Fields</Text>
        <Text style={styles.infoItem}>• Email, Gender, Birthday, Notes</Text>
      </View>
    </View>
  );

  const renderMappingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Map Columns</Text>
      <Text style={styles.stepDescription}>
        Match your CSV columns to client fields. Required fields are marked with *.
      </Text>

      <ScrollView style={styles.mappingList}>
        {csvData?.headers.map(header => {
          const mappedTo = columnMapping[header];
          const field = EXPECTED_FIELDS.find(f => f.key === mappedTo);
          
          return (
            <TouchableOpacity
              key={header}
              style={styles.mappingRow}
              onPress={() => {
                setSelectedColumn(header);
                setShowMappingModal(true);
              }}
            >
              <View style={styles.mappingSource}>
                <Text style={styles.mappingLabel}>CSV Column</Text>
                <Text style={styles.mappingValue}>{header}</Text>
                {csvData.rows.length > 0 && (
                  <Text style={styles.mappingSample} numberOfLines={1}>
                    e.g., {csvData.rows[0][csvData.headers.indexOf(header)] || '(empty)'}
                  </Text>
                )}
              </View>
              <Text style={styles.mappingArrow}>→</Text>
              <View style={styles.mappingTarget}>
                <Text style={styles.mappingLabel}>Maps To</Text>
                <Text style={[styles.mappingValue, !field && styles.mappingUnmapped]}>
                  {field?.label || 'Not mapped'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!requiredFieldsMapped && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Please map all required fields: First Name, Last Name, and Phone
          </Text>
        </View>
      )}

      <View style={styles.stepActions}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('upload')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !requiredFieldsMapped && styles.buttonDisabled]}
          onPress={handleValidate}
          disabled={!requiredFieldsMapped || isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.nextButtonText}>Validate Data</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreviewStep = () => {
    if (!validationResult) return null;
    const { valid, invalid, duplicates } = validationResult;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review Import</Text>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.summaryCardSuccess]}>
            <Text style={styles.summaryValue}>{valid.length}</Text>
            <Text style={styles.summaryLabel}>Ready to Import</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardError]}>
            <Text style={styles.summaryValue}>{invalid.length}</Text>
            <Text style={styles.summaryLabel}>Errors</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardWarning]}>
            <Text style={styles.summaryValue}>{duplicates.length}</Text>
            <Text style={styles.summaryLabel}>Duplicates</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'valid' && styles.tabActive]}
            onPress={() => setActiveTab('valid')}
          >
            <Text style={[styles.tabText, activeTab === 'valid' && styles.tabTextActive]}>
              Valid ({valid.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'errors' && styles.tabActive]}
            onPress={() => setActiveTab('errors')}
          >
            <Text style={[styles.tabText, activeTab === 'errors' && styles.tabTextActive]}>
              Errors ({invalid.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'duplicates' && styles.tabActive]}
            onPress={() => setActiveTab('duplicates')}
          >
            <Text style={[styles.tabText, activeTab === 'duplicates' && styles.tabTextActive]}>
              Duplicates ({duplicates.length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeTab === 'valid' ? valid : activeTab === 'errors' ? invalid : duplicates}
          style={styles.previewList}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            if (activeTab === 'valid') {
              const client = item as ImportClientRow;
              return (
                <View style={styles.previewItem}>
                  <Text style={styles.previewName}>{client.firstName} {client.lastName}</Text>
                  <Text style={styles.previewDetail}>{client.phone}</Text>
                  {client.email && <Text style={styles.previewDetail}>{client.email}</Text>}
                </View>
              );
            } else if (activeTab === 'errors') {
              const errorRow = item as InvalidClientRow;
              return (
                <View style={[styles.previewItem, styles.previewItemError]}>
                  <Text style={styles.previewName}>Row {errorRow.rowIndex + 2}</Text>
                  {errorRow.errors.map((err, i) => (
                    <Text key={i} style={styles.previewError}>{err}</Text>
                  ))}
                </View>
              );
            } else {
              const dup = item as DuplicateClientRow;
              return (
                <View style={[styles.previewItem, styles.previewItemWarning]}>
                  <Text style={styles.previewName}>{dup.data.firstName} {dup.data.lastName}</Text>
                  <Text style={styles.previewDuplicate}>
                    Matches existing: {dup.existingClientName} ({dup.matchField})
                  </Text>
                </View>
              );
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>
                {activeTab === 'valid' ? 'No valid records' : 
                 activeTab === 'errors' ? 'No errors found' : 'No duplicates found'}
              </Text>
            </View>
          }
        />

        <View style={styles.optionsCard}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSkipDuplicates(!skipDuplicates)}>
            <View>
              <Text style={styles.optionLabel}>Skip Duplicates</Text>
              <Text style={styles.optionDescription}>Don't import records that match existing clients</Text>
            </View>
            <View style={[styles.checkbox, skipDuplicates && styles.checkboxChecked]}>
              {skipDuplicates && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSendWelcome(!sendWelcome)}>
            <View>
              <Text style={styles.optionLabel}>Send Welcome Message</Text>
              <Text style={styles.optionDescription}>Send SMS to newly imported clients</Text>
            </View>
            <View style={[styles.checkbox, sendWelcome && styles.checkboxChecked]}>
              {sendWelcome && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.stepActions}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('mapping')}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, valid.length === 0 && styles.buttonDisabled]}
            onPress={handleStartImport}
            disabled={valid.length === 0 || isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.nextButtonText}>Import {valid.length} Clients</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderImportingStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.progressContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
        <Text style={styles.progressTitle}>Importing Clients...</Text>
        {importStatus && (
          <>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(importStatus.processedRows / importStatus.totalRows) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {importStatus.processedRows} of {importStatus.totalRows} processed
            </Text>
          </>
        )}
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeContainer}>
        <Text style={styles.completeIcon}>
          {importStatus?.status === 'completed' ? '✓' : '✗'}
        </Text>
        <Text style={styles.completeTitle}>
          {importStatus?.status === 'completed' ? 'Import Complete!' : 'Import Failed'}
        </Text>
        {importStatus && (
          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{importStatus.successCount}</Text>
              <Text style={styles.completeStatLabel}>Imported</Text>
            </View>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{importStatus.failedCount}</Text>
              <Text style={styles.completeStatLabel}>Failed</Text>
            </View>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{importStatus.skippedDuplicates}</Text>
              <Text style={styles.completeStatLabel}>Skipped</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/clients')}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>View Clients</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Import Clients',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
        }}
      />

      <View style={styles.stepsIndicator}>
        {['Upload', 'Map', 'Preview', 'Import'].map((label, index) => {
          const stepIndex = ['upload', 'mapping', 'preview', 'importing'].indexOf(step);
          const isActive = index <= stepIndex || step === 'complete';
          return (
            <View key={label} style={styles.stepIndicator}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                {index < stepIndex || step === 'complete' ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {step === 'upload' && renderUploadStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}

      <Modal visible={showMappingModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMappingModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Map "{selectedColumn}"</Text>
            <TouchableOpacity
              style={[styles.modalOption, !columnMapping[selectedColumn || ''] && styles.modalOptionSelected]}
              onPress={() => handleMappingSelect(selectedColumn || '', null)}
            >
              <Text style={styles.modalOptionText}>Don't Import</Text>
            </TouchableOpacity>
            {EXPECTED_FIELDS.map(field => {
              const isSelected = columnMapping[selectedColumn || ''] === field.key;
              const isMappedElsewhere = Object.entries(columnMapping).some(
                ([col, target]) => target === field.key && col !== selectedColumn
              );
              return (
                <TouchableOpacity
                  key={field.key}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                    isMappedElsewhere && styles.modalOptionDisabled,
                  ]}
                  onPress={() => !isMappedElsewhere && handleMappingSelect(selectedColumn || '', field.key)}
                  disabled={isMappedElsewhere}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                      isMappedElsewhere && styles.modalOptionTextDisabled,
                    ]}
                  >
                    {field.label} {field.required ? '*' : ''}
                    {isMappedElsewhere && ' (already mapped)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepDotActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  stepNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepCheck: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  stepLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  uploadArea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: FONT_SIZES.xxxl + 16,
    marginBottom: SPACING.lg,
  },
  uploadTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  uploadDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  uploadButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '100%',
  },
  uploadButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  templateButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  templateButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  mappingList: {
    flex: 1,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  mappingSource: {
    flex: 1,
  },
  mappingTarget: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mappingArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  mappingLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  mappingValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  mappingUnmapped: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  mappingSample: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: `${COLORS.amber}20`,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
    textAlign: 'center',
  },
  stepActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  backButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  summaryCardSuccess: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  summaryCardError: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  summaryCardWarning: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  previewList: {
    flex: 1,
  },
  previewItem: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  previewItemError: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  previewItemWarning: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
  },
  previewName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  previewDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewError: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    marginTop: 2,
  },
  previewDuplicate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
    marginTop: 2,
  },
  emptyList: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  optionsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm - 2,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  progressTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm / 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.violet,
  },
  progressText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  completeIcon: {
    fontSize: FONT_SIZES.xxxl * 2,
    marginBottom: SPACING.lg,
  },
  completeTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  completeStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  completeStat: {
    alignItems: 'center',
  },
  completeStatValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  completeStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  doneButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '100%',
  },
  doneButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.violet}20`,
  },
  modalOptionDisabled: {
    opacity: 0.5,
  },
  modalOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  modalOptionTextDisabled: {
    color: COLORS.textMuted,
  },
});
