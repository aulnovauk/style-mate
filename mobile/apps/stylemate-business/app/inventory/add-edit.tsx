import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';
import {
  useInventoryProduct,
  useProductCategories,
  useVendors,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { CreateProductParams } from '@stylemate/core/services/businessApi';

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { step: 1, title: 'Basic Info', icon: '📝' },
  { step: 2, title: 'Stock', icon: '📦' },
  { step: 3, title: 'Pricing', icon: '💰' },
  { step: 4, title: 'Retail', icon: '🛒' },
];

const UNIT_OPTIONS = ['piece', 'ml', 'g', 'kg', 'L', 'oz', 'pack', 'bottle', 'tube', 'box'];

interface FormData {
  name: string;
  sku: string;
  description: string;
  brand: string;
  size: string;
  unit: string;
  categoryId: string;
  vendorId: string;
  barcode: string;
  location: string;
  currentStock: string;
  minimumStock: string;
  maximumStock: string;
  reorderPoint: string;
  reorderQuantity: string;
  leadTimeDays: string;
  batchNumber: string;
  expiryDate: string;
  trackStock: boolean;
  lowStockAlert: boolean;
  costPriceInPaisa: string;
  sellingPriceInPaisa: string;
  notes: string;
  isActive: boolean;
  availableForRetail: boolean;
  retailPriceInPaisa: string;
  retailDescription: string;
  retailStockAllocated: string;
  featured: boolean;
}

const initialFormData: FormData = {
  name: '',
  sku: '',
  description: '',
  brand: '',
  size: '',
  unit: 'piece',
  categoryId: '',
  vendorId: '',
  barcode: '',
  location: '',
  currentStock: '0',
  minimumStock: '0',
  maximumStock: '',
  reorderPoint: '',
  reorderQuantity: '',
  leadTimeDays: '7',
  batchNumber: '',
  expiryDate: '',
  trackStock: true,
  lowStockAlert: true,
  costPriceInPaisa: '',
  sellingPriceInPaisa: '',
  notes: '',
  isActive: true,
  availableForRetail: false,
  retailPriceInPaisa: '',
  retailDescription: '',
  retailStockAllocated: '',
  featured: false,
};

function StepIndicator({ currentStep, steps }: { currentStep: WizardStep; steps: typeof STEPS }) {
  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step.step && styles.stepCircleActive,
              currentStep === step.step && styles.stepCircleCurrent,
            ]}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>
          <Text
            style={[
              styles.stepTitle,
              currentStep >= step.step && styles.stepTitleActive,
            ]}
          >
            {step.title}
          </Text>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step.step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  required?: boolean;
  error?: string;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error && styles.textInputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

function SelectField({ label, value, options, onSelect, placeholder }: SelectFieldProps) {
  const [showOptions, setShowOptions] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder || 'Select...';

  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
          {selectedLabel}
        </Text>
        <Text style={styles.selectArrow}>{showOptions ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, value === option.value && styles.optionSelected]}
              onPress={() => {
                onSelect(option.value);
                setShowOptions(false);
              }}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

interface SwitchFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SwitchField({ label, description, value, onValueChange }: SwitchFieldProps) {
  return (
    <View style={styles.switchField}>
      <View style={styles.switchInfo}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && <Text style={styles.switchDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.cardBorder, true: COLORS.violet }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

export default function AddEditProduct() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { product, loading: productLoading } = useInventoryProduct(params.id);
  const { categories } = useProductCategories();
  const { vendors } = useVendors();
  const { createProduct, updateProduct, isSubmitting } = useInventoryActions();

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        brand: product.brand || '',
        size: product.size || '',
        unit: product.unit || 'piece',
        categoryId: product.categoryId || '',
        vendorId: product.vendorId || '',
        barcode: product.barcode || '',
        location: product.location || '',
        currentStock: String(product.currentStock) || '0',
        minimumStock: String(product.minimumStock) || '0',
        maximumStock: product.maximumStock ? String(product.maximumStock) : '',
        reorderPoint: product.reorderPoint ? String(product.reorderPoint) : '',
        reorderQuantity: product.reorderQuantity ? String(product.reorderQuantity) : '',
        leadTimeDays: String(product.leadTimeDays) || '7',
        batchNumber: product.batchNumber || '',
        expiryDate: product.expiryDate || '',
        trackStock: product.trackStock === 1,
        lowStockAlert: product.lowStockAlert === 1,
        costPriceInPaisa: String(product.costPriceInPaisa / 100) || '',
        sellingPriceInPaisa: product.sellingPriceInPaisa ? String(product.sellingPriceInPaisa / 100) : '',
        notes: product.notes || '',
        isActive: product.isActive === 1,
        availableForRetail: product.availableForRetail === 1,
        retailPriceInPaisa: product.retailPriceInPaisa ? String(product.retailPriceInPaisa / 100) : '',
        retailDescription: product.retailDescription || '',
        retailStockAllocated: product.retailStockAllocated ? String(product.retailStockAllocated) : '',
        featured: product.featured === 1,
      });
    }
  }, [product, isEditing]);

  const categoryOptions = useMemo(() => 
    categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );

  const vendorOptions = useMemo(() => 
    vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
    [vendors]
  );

  const unitOptions = useMemo(() => 
    UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })),
    []
  );

  const updateFormData = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const isValidPositiveNumber = (value: string): boolean => {
    if (!value || !value.trim()) return false;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  };

  const isValidRequiredPositiveNumber = (value: string): boolean => {
    if (!value || !value.trim()) return false;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };

  const safeParseInt = (value: string, defaultValue: number = 0): number => {
    if (!value || !value.trim()) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  };

  const safeParseFloat = (value: string, defaultValue: number = 0): number => {
    if (!value || !value.trim()) return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const safeParsePaisa = (rupeesString: string): number | undefined => {
    if (!rupeesString || !rupeesString.trim()) return undefined;
    const num = parseFloat(rupeesString);
    if (isNaN(num) || num < 0) return undefined;
    return Math.round(num * 100);
  };

  const safeParseRequiredPaisa = (rupeesString: string): number => {
    if (!rupeesString || !rupeesString.trim()) return 0;
    const num = parseFloat(rupeesString);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Product name is required';
      if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    }

    if (step === 2) {
      if (formData.currentStock && !isValidPositiveNumber(formData.currentStock)) {
        newErrors.currentStock = 'Enter a valid stock quantity';
      }
      if (formData.minimumStock && !isValidPositiveNumber(formData.minimumStock)) {
        newErrors.minimumStock = 'Enter a valid minimum stock';
      }
      if (formData.maximumStock && !isValidPositiveNumber(formData.maximumStock)) {
        newErrors.maximumStock = 'Enter a valid maximum stock';
      }
      if (formData.reorderPoint && !isValidPositiveNumber(formData.reorderPoint)) {
        newErrors.reorderPoint = 'Enter a valid reorder point';
      }
    }

    if (step === 3) {
      if (!formData.costPriceInPaisa.trim()) {
        newErrors.costPriceInPaisa = 'Cost price is required';
      } else if (!isValidRequiredPositiveNumber(formData.costPriceInPaisa)) {
        newErrors.costPriceInPaisa = 'Enter a valid cost price greater than 0';
      }
      if (formData.sellingPriceInPaisa && !isValidPositiveNumber(formData.sellingPriceInPaisa)) {
        newErrors.sellingPriceInPaisa = 'Enter a valid selling price';
      }
    }

    if (step === 4 && formData.availableForRetail) {
      if (formData.retailPriceInPaisa && !isValidPositiveNumber(formData.retailPriceInPaisa)) {
        newErrors.retailPriceInPaisa = 'Enter a valid retail price';
      }
      if (formData.retailStockAllocated) {
        const allocated = parseFloat(formData.retailStockAllocated);
        const current = parseFloat(formData.currentStock) || 0;
        if (isNaN(allocated) || allocated < 0) {
          newErrors.retailStockAllocated = 'Enter a valid quantity';
        } else if (allocated > current) {
          newErrors.retailStockAllocated = 'Cannot allocate more than current stock';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as WizardStep);
      } else {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    const params: CreateProductParams = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      description: formData.description.trim() || undefined,
      brand: formData.brand.trim() || undefined,
      size: formData.size.trim() || undefined,
      unit: formData.unit,
      categoryId: formData.categoryId || undefined,
      vendorId: formData.vendorId || undefined,
      barcode: formData.barcode.trim() || undefined,
      location: formData.location.trim() || undefined,
      currentStock: safeParseFloat(formData.currentStock, 0),
      minimumStock: safeParseFloat(formData.minimumStock, 0),
      maximumStock: formData.maximumStock.trim() ? safeParseFloat(formData.maximumStock) : undefined,
      reorderPoint: formData.reorderPoint.trim() ? safeParseFloat(formData.reorderPoint) : undefined,
      reorderQuantity: formData.reorderQuantity.trim() ? safeParseFloat(formData.reorderQuantity) : undefined,
      leadTimeDays: safeParseInt(formData.leadTimeDays, 7),
      batchNumber: formData.batchNumber.trim() || undefined,
      expiryDate: formData.expiryDate || undefined,
      trackStock: formData.trackStock ? 1 : 0,
      lowStockAlert: formData.lowStockAlert ? 1 : 0,
      costPriceInPaisa: safeParseRequiredPaisa(formData.costPriceInPaisa),
      sellingPriceInPaisa: safeParsePaisa(formData.sellingPriceInPaisa),
      notes: formData.notes.trim() || undefined,
      isActive: formData.isActive ? 1 : 0,
      availableForRetail: formData.availableForRetail ? 1 : 0,
      retailPriceInPaisa: safeParsePaisa(formData.retailPriceInPaisa),
      retailDescription: formData.retailDescription.trim() || undefined,
      retailStockAllocated: formData.retailStockAllocated.trim() ? safeParseFloat(formData.retailStockAllocated) : undefined,
      featured: formData.featured ? 1 : 0,
    };

    let result;
    if (isEditing && product) {
      result = await updateProduct(product.id, params);
    } else {
      result = await createProduct(params);
    }

    if (result.success) {
      Alert.alert('Success', `Product ${isEditing ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to save product');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Basic Information</Text>
      <Text style={styles.stepSubheader}>Enter the product details</Text>

      <FormField
        label="Product Name"
        value={formData.name}
        onChangeText={(text) => updateFormData('name', text)}
        placeholder="e.g., L'Oreal Shampoo 500ml"
        required
        error={errors.name}
      />

      <FormField
        label="SKU"
        value={formData.sku}
        onChangeText={(text) => updateFormData('sku', text)}
        placeholder="e.g., LOR-SHP-500"
        required
        error={errors.sku}
      />

      <FormField
        label="Description"
        value={formData.description}
        onChangeText={(text) => updateFormData('description', text)}
        placeholder="Product description..."
        multiline
      />

      <FormField
        label="Brand"
        value={formData.brand}
        onChangeText={(text) => updateFormData('brand', text)}
        placeholder="e.g., L'Oreal"
      />

      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <FormField
            label="Size"
            value={formData.size}
            onChangeText={(text) => updateFormData('size', text)}
            placeholder="e.g., 500ml"
          />
        </View>
        <View style={styles.halfField}>
          <SelectField
            label="Unit"
            value={formData.unit}
            options={unitOptions}
            onSelect={(value) => updateFormData('unit', value)}
          />
        </View>
      </View>

      <SelectField
        label="Category"
        value={formData.categoryId}
        options={categoryOptions}
        onSelect={(value) => updateFormData('categoryId', value)}
        placeholder="Select category..."
      />

      <SelectField
        label="Supplier"
        value={formData.vendorId}
        options={vendorOptions}
        onSelect={(value) => updateFormData('vendorId', value)}
        placeholder="Select supplier..."
      />

      <FormField
        label="Barcode"
        value={formData.barcode}
        onChangeText={(text) => updateFormData('barcode', text)}
        placeholder="Scan or enter barcode"
      />

      <FormField
        label="Storage Location"
        value={formData.location}
        onChangeText={(text) => updateFormData('location', text)}
        placeholder="e.g., Shelf A-2"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Stock Settings</Text>
      <Text style={styles.stepSubheader}>Configure inventory tracking</Text>

      <SwitchField
        label="Track Stock"
        description="Enable stock tracking for this product"
        value={formData.trackStock}
        onValueChange={(value) => updateFormData('trackStock', value)}
      />

      <SwitchField
        label="Low Stock Alert"
        description="Get notified when stock is low"
        value={formData.lowStockAlert}
        onValueChange={(value) => updateFormData('lowStockAlert', value)}
      />

      <FormField
        label="Current Stock"
        value={formData.currentStock}
        onChangeText={(text) => updateFormData('currentStock', text)}
        placeholder="0"
        keyboardType="decimal-pad"
      />

      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <FormField
            label="Minimum Stock"
            value={formData.minimumStock}
            onChangeText={(text) => updateFormData('minimumStock', text)}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfField}>
          <FormField
            label="Maximum Stock"
            value={formData.maximumStock}
            onChangeText={(text) => updateFormData('maximumStock', text)}
            placeholder="Optional"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <FormField
            label="Reorder Point"
            value={formData.reorderPoint}
            onChangeText={(text) => updateFormData('reorderPoint', text)}
            placeholder="Auto-reorder at..."
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfField}>
          <FormField
            label="Reorder Quantity"
            value={formData.reorderQuantity}
            onChangeText={(text) => updateFormData('reorderQuantity', text)}
            placeholder="Suggested order qty"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <FormField
        label="Lead Time (Days)"
        value={formData.leadTimeDays}
        onChangeText={(text) => updateFormData('leadTimeDays', text)}
        placeholder="7"
        keyboardType="numeric"
      />

      <FormField
        label="Batch Number"
        value={formData.batchNumber}
        onChangeText={(text) => updateFormData('batchNumber', text)}
        placeholder="Optional batch number"
      />

      <FormField
        label="Expiry Date"
        value={formData.expiryDate}
        onChangeText={(text) => updateFormData('expiryDate', text)}
        placeholder="YYYY-MM-DD"
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Pricing</Text>
      <Text style={styles.stepSubheader}>Set product pricing</Text>

      <FormField
        label="Cost Price (₹)"
        value={formData.costPriceInPaisa}
        onChangeText={(text) => updateFormData('costPriceInPaisa', text)}
        placeholder="0.00"
        keyboardType="decimal-pad"
        required
        error={errors.costPriceInPaisa}
      />

      <FormField
        label="Selling Price (₹)"
        value={formData.sellingPriceInPaisa}
        onChangeText={(text) => updateFormData('sellingPriceInPaisa', text)}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      {formData.costPriceInPaisa && formData.sellingPriceInPaisa && (
        <View style={styles.marginInfo}>
          <Text style={styles.marginLabel}>Profit Margin:</Text>
          <Text style={styles.marginValue}>
            {(
              ((parseFloat(formData.sellingPriceInPaisa) - parseFloat(formData.costPriceInPaisa)) /
                parseFloat(formData.costPriceInPaisa)) *
              100
            ).toFixed(1)}
            %
          </Text>
        </View>
      )}

      <FormField
        label="Notes"
        value={formData.notes}
        onChangeText={(text) => updateFormData('notes', text)}
        placeholder="Internal notes..."
        multiline
      />

      <SwitchField
        label="Active"
        description="Product is visible and available"
        value={formData.isActive}
        onValueChange={(value) => updateFormData('isActive', value)}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Retail Settings</Text>
      <Text style={styles.stepSubheader}>Configure for online shop sales</Text>

      <SwitchField
        label="Available for Online Sale"
        description="List this product in your online shop"
        value={formData.availableForRetail}
        onValueChange={(value) => updateFormData('availableForRetail', value)}
      />

      {formData.availableForRetail && (
        <>
          <FormField
            label="Retail Price (₹)"
            value={formData.retailPriceInPaisa}
            onChangeText={(text) => updateFormData('retailPriceInPaisa', text)}
            placeholder="Customer-facing price"
            keyboardType="decimal-pad"
          />

          <FormField
            label="Retail Description"
            value={formData.retailDescription}
            onChangeText={(text) => updateFormData('retailDescription', text)}
            placeholder="Shop-specific description..."
            multiline
          />

          <FormField
            label="Stock Allocated for Retail"
            value={formData.retailStockAllocated}
            onChangeText={(text) => updateFormData('retailStockAllocated', text)}
            placeholder="Units reserved for online sales"
            keyboardType="decimal-pad"
          />

          {formData.currentStock && formData.retailStockAllocated && (
            <View style={styles.allocationBar}>
              <View style={styles.allocationInfo}>
                <Text style={styles.allocationLabel}>Retail Allocation</Text>
                <Text style={styles.allocationValue}>
                  {formData.retailStockAllocated} of {formData.currentStock} units
                </Text>
              </View>
              <View style={styles.allocationProgress}>
                <View
                  style={[
                    styles.allocationFill,
                    {
                      width: `${Math.min(
                        100,
                        (parseFloat(formData.retailStockAllocated) / parseFloat(formData.currentStock)) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <SwitchField
            label="Featured Product"
            description="Highlight this product in your shop"
            value={formData.featured}
            onValueChange={(value) => updateFormData('featured', value)}
          />
        </>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  if (isEditing && productLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Product' : 'Add Product'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        <View style={styles.bottomBar}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.primaryButton, currentStep === 1 && styles.primaryButtonFull]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {currentStep === 4 ? (isEditing ? 'Update' : 'Create') : 'Next'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}20`,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.violet,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 24,
    right: -50,
    width: 100,
    height: 2,
    backgroundColor: COLORS.cardBorder,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  stepContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepHeader: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubheader: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  requiredStar: {
    color: COLORS.red,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  selectButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  selectButtonPlaceholder: {
    color: COLORS.textMuted,
  },
  selectArrow: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  optionsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    maxHeight: 200,
  },
  option: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  optionSelected: {
    backgroundColor: `${COLORS.violet}20`,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  optionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  marginInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.green}15`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  marginLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  marginValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.green,
  },
  allocationBar: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  allocationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  allocationLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  allocationValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  allocationProgress: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    backgroundColor: COLORS.violet,
    borderRadius: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  primaryButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
