import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, differenceInDays } from 'date-fns';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import {
  useLeaveRequests,
  useLeaveActions,
  LeaveRequest as LeaveRequestType,
  LeaveBalance,
} from '@stylemate/core';

const LEAVE_TYPES = [
  { id: 'sick', name: 'Sick Leave', icon: '🤒', color: COLORS.red },
  { id: 'casual', name: 'Casual Leave', icon: '🏖️', color: COLORS.blue },
  { id: 'earned', name: 'Earned Leave', icon: '⭐', color: COLORS.green },
  { id: 'unpaid', name: 'Unpaid Leave', icon: '💼', color: COLORS.amber },
  { id: 'half_day', name: 'Half Day', icon: '🌓', color: COLORS.purple },
];


export default function LeaveManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  
  const status = activeTab === 'pending' ? 'pending' : undefined;
  
  const { 
    data: leaveData, 
    loading: isLoading, 
    error,
    refetch 
  } = useLeaveRequests(status);
  
  const { 
    reviewRequest, 
    isReviewing 
  } = useLeaveActions();
  
  const requests = leaveData?.requests || [];
  const balance = leaveData?.balance;
  const stats = leaveData?.stats || { pending: 0, approved: 0, rejected: 0 };
  const hasBalanceData = !!balance;

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  const getLeaveType = (typeId: string) => LEAVE_TYPES.find(t => t.id === typeId);
  
  const getDaysCount = (startDate: string, endDate: string): number => {
    return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  };

  const handleApprove = async (request: LeaveRequestType) => {
    const result = await reviewRequest({
      leaveId: request.id,
      action: 'approve',
      note: reviewNote || undefined,
    });
    
    if (result.success) {
      Alert.alert('Approved', `Leave request for ${request.staffName} has been approved`);
      setShowDetailModal(false);
      setReviewNote('');
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to approve request');
    }
  };

  const handleReject = async (request: LeaveRequestType) => {
    if (!reviewNote.trim()) {
      Alert.alert('Note Required', 'Please provide a reason for rejection');
      return;
    }
    
    const result = await reviewRequest({
      leaveId: request.id,
      action: 'reject',
      note: reviewNote,
    });
    
    if (result.success) {
      Alert.alert('Rejected', `Leave request for ${request.staffName} has been rejected`);
      setShowDetailModal(false);
      setReviewNote('');
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to reject request');
    }
  };

  const renderRequestCard = (request: LeaveRequestType) => {
    const leaveType = getLeaveType(request.type);
    const days = getDaysCount(request.startDate, request.endDate);
    
    return (
      <TouchableOpacity 
        key={request.id}
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(request);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.staffAvatar}>
            <Text style={styles.avatarText}>
              {request.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{request.staffName}</Text>
            <Text style={styles.staffRole}>{request.staffRole}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: request.status === 'approved' ? `${COLORS.green}20` : request.status === 'rejected' ? `${COLORS.red}20` : `${COLORS.amber}20` }
          ]}>
            <Text style={[
              styles.statusText,
              { color: request.status === 'approved' ? COLORS.green : request.status === 'rejected' ? COLORS.red : COLORS.amber }
            ]}>
              {request.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.leaveTypeBadge, { backgroundColor: `${leaveType?.color || COLORS.violet}20` }]}>
            <Text style={styles.leaveTypeIcon}>{leaveType?.icon}</Text>
            <Text style={[styles.leaveTypeName, { color: leaveType?.color }]}>{leaveType?.name}</Text>
          </View>
          
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {format(new Date(request.startDate), 'MMM d')}
              {request.startDate !== request.endDate && ` - ${format(new Date(request.endDate), 'MMM d')}`}
            </Text>
            <Text style={styles.daysText}>{days} {days === 1 ? 'day' : 'days'}</Text>
          </View>
          
          <Text style={styles.reasonText} numberOfLines={2}>{request.reason}</Text>
        </View>

        {request.status === 'pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.rejectBtn}
              onPress={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.approveBtn}
              onPress={() => handleApprove(request)}
            >
              <LinearGradient colors={GRADIENTS.success} style={styles.approveBtnGradient}>
                <Text style={styles.approveText}>Approve</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.balanceSection}>
        <Text style={styles.sectionTitle}>Leave Balance Overview</Text>
        {hasBalanceData ? (
          <View style={styles.balanceCards}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceIcon}>🤒</Text>
              <Text style={styles.balanceLabel}>Sick</Text>
              <Text style={styles.balanceValue}>{balance.sick.available}/{balance.sick.total}</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceIcon}>🏖️</Text>
              <Text style={styles.balanceLabel}>Casual</Text>
              <Text style={styles.balanceValue}>{balance.casual.available}/{balance.casual.total}</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceIcon}>⭐</Text>
              <Text style={styles.balanceLabel}>Earned</Text>
              <Text style={styles.balanceValue}>{balance.earned.available}/{balance.earned.total}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>Leave balance not configured</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({stats.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
        {(activeTab === 'pending' ? pendingRequests : historyRequests).map(renderRequestCard)}
        
        {(activeTab === 'pending' ? pendingRequests : historyRequests).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{activeTab === 'pending' ? '✅' : '📋'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? 'No pending requests' : 'No leave history'}
            </Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalStaffInfo}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedRequest.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalStaffName}>{selectedRequest.staffName}</Text>
                      <Text style={styles.modalStaffRole}>{selectedRequest.staffRole}</Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Leave Type</Text>
                    <View style={[styles.leaveTypeBadge, { backgroundColor: `${getLeaveType(selectedRequest.type)?.color || COLORS.violet}20` }]}>
                      <Text style={styles.leaveTypeIcon}>{getLeaveType(selectedRequest.type)?.icon}</Text>
                      <Text style={[styles.leaveTypeName, { color: getLeaveType(selectedRequest.type)?.color }]}>
                        {getLeaveType(selectedRequest.type)?.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>
                      {format(new Date(selectedRequest.startDate), 'MMM d, yyyy')}
                      {selectedRequest.startDate !== selectedRequest.endDate && ` - ${format(new Date(selectedRequest.endDate), 'MMM d, yyyy')}`}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Days</Text>
                    <Text style={styles.detailValue}>
                      {getDaysCount(selectedRequest.startDate, selectedRequest.endDate)} {getDaysCount(selectedRequest.startDate, selectedRequest.endDate) === 1 ? 'day' : 'days'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <Text style={styles.detailValue}>{selectedRequest.reason}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested On</Text>
                    <Text style={styles.detailValue}>{format(new Date(selectedRequest.createdAt), 'MMM d, yyyy')}</Text>
                  </View>

                  {selectedRequest.status === 'pending' && (
                    <View style={styles.noteInput}>
                      <Text style={styles.detailLabel}>Note (optional for approval, required for rejection)</Text>
                      <TextInput
                        style={styles.noteTextInput}
                        value={reviewNote}
                        onChangeText={setReviewNote}
                        placeholder="Add a note..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}

                  {selectedRequest.reviewNote && (
                    <View style={styles.reviewNoteBox}>
                      <Text style={styles.reviewNoteLabel}>Review Note</Text>
                      <Text style={styles.reviewNoteText}>{selectedRequest.reviewNote}</Text>
                    </View>
                  )}
                </ScrollView>

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.modalRejectBtn}
                      onPress={() => handleReject(selectedRequest)}
                      disabled={isReviewing}
                    >
                      <Text style={styles.modalRejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalApproveBtn}
                      onPress={() => handleApprove(selectedRequest)}
                      disabled={isReviewing}
                    >
                      <LinearGradient colors={GRADIENTS.success} style={styles.modalApproveBtnGradient}>
                        {isReviewing ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.modalApproveText}>Approve</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetailModal(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  balanceSection: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  balanceIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.sm,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  requestCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  staffRole: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    marginBottom: SPACING.md,
  },
  leaveTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  leaveTypeIcon: {
    fontSize: FONT_SIZES.md,
  },
  leaveTypeName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  daysText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.violet,
  },
  reasonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.red,
  },
  approveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  approveBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  approveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
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
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
  modalHeader: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalStaffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalStaffName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalStaffRole: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  modalBody: {
    padding: SPACING.xl,
  },
  detailRow: {
    marginBottom: SPACING.lg,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  noteInput: {
    marginTop: SPACING.md,
  },
  noteTextInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: SPACING.sm,
  },
  reviewNoteBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  reviewNoteLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  reviewNoteText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  modalRejectBtn: {
    flex: 1,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalRejectText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.red,
  },
  modalApproveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  modalApproveBtnGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  modalApproveText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalCloseBtn: {
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noDataCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
