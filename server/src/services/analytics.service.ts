import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AnalyticsService {
  async getAnalytics(companyId: string, filters?: any) {
    try {
      return await storage.getAnalytics(companyId, filters);
    } catch (error) {
      logger.error('Failed to get analytics', { companyId, filters, error });
      throw new AppError('Failed to retrieve analytics', 500);
    }
  }

  async getPerformanceDistribution(companyId: string, cycleId?: string) {
    try {
      return await storage.getPerformanceDistribution(companyId, cycleId);
    } catch (error) {
      logger.error('Failed to get performance distribution', { companyId, cycleId, error });
      throw new AppError('Failed to retrieve performance distribution', 500);
    }
  }

  async getEvaluationTrends(companyId: string, filters?: any) {
    try {
      return await storage.getEvaluationTrends(companyId, filters);
    } catch (error) {
      logger.error('Failed to get evaluation trends', { companyId, filters, error });
      throw new AppError('Failed to retrieve evaluation trends', 500);
    }
  }

  async getDepartmentAnalytics(companyId: string, departmentId?: string) {
    try {
      return await storage.getDepartmentAnalytics(companyId, departmentId);
    } catch (error) {
      logger.error('Failed to get department analytics', { companyId, departmentId, error });
      throw new AppError('Failed to retrieve department analytics', 500);
    }
  }

  async getManagerAnalytics(managerId: string) {
    try {
      return await storage.getManagerAnalytics(managerId);
    } catch (error) {
      logger.error('Failed to get manager analytics', { managerId, error });
      throw new AppError('Failed to retrieve manager analytics', 500);
    }
  }

  /**
   * Get comprehensive performance trends for HR Manager analytics dashboard
   */
  async getPerformanceTrends(requestingUserId: string) {
    try {
      const requestingUser = await storage.getUser(requestingUserId);
      
      if (!requestingUser?.companyId) {
        throw new AppError("User must belong to a company", 400);
      }
      
      const companyId = requestingUser.companyId;
      
      // Get all evaluations for the company with ratings
      const allEvaluations = await storage.getEvaluationsForCalibration(companyId);
      const completedEvaluations = allEvaluations.filter(e => e.overallRating !== null && e.overallRating !== undefined);
      
      // Get all users for the company
      const users = await storage.getUsers({ companyId }, requestingUserId);
      
      // Get appraisal cycles for the company
      let adminId = requestingUserId;
      if (requestingUser.role === 'hr_manager') {
        const companyAdmins = await storage.getUsers({ role: 'admin', companyId });
        if (companyAdmins && companyAdmins.length > 0) {
          adminId = companyAdmins[0].id;
        }
      }
      const appraisalCycles = await storage.getAppraisalCycles(adminId);
      const locations = await storage.getLocations(adminId);
      const levels = await storage.getLevels(adminId);
      const grades = await storage.getGrades(adminId);
      
      // 1. Rating Distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: completedEvaluations.filter(e => e.overallRating === rating).length,
        calibratedCount: completedEvaluations.filter(e => e.calibratedRating === rating).length,
      }));
      
      // 2. Performance Trends by Appraisal Cycle
      const cyclePerformance = appraisalCycles.map(cycle => {
        const cycleEvaluations = completedEvaluations.filter(e => (e as any).appraisalCycleId === cycle.id);
        const ratings = cycleEvaluations.map(e => e.overallRating as number);
        const calibratedRatings = cycleEvaluations.filter(e => e.calibratedRating).map(e => e.calibratedRating as number);
        
        return {
          cycleId: cycle.id,
          cycleName: cycle.code,
          cycleDescription: cycle.description,
          totalEvaluations: cycleEvaluations.length,
          averageRating: ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0,
          averageCalibratedRating: calibratedRatings.length > 0 ? Number((calibratedRatings.reduce((a, b) => a + b, 0) / calibratedRatings.length).toFixed(2)) : 0,
          completionRate: cycleEvaluations.length > 0 ? Math.round((cycleEvaluations.filter(e => e.meetingCompletedAt).length / cycleEvaluations.length) * 100) : 0,
        };
      }).filter(c => c.totalEvaluations > 0);
      
      // 3. Department Performance Comparison
      const departmentPerformance: Record<string, { count: number; totalRating: number; name: string }> = {};
      completedEvaluations.forEach(e => {
        const dept = (e as any).department || 'Unknown';
        if (!departmentPerformance[dept]) {
          departmentPerformance[dept] = { count: 0, totalRating: 0, name: dept };
        }
        departmentPerformance[dept].count++;
        departmentPerformance[dept].totalRating += (e.overallRating as number) || 0;
      });
      
      const departmentStats = Object.values(departmentPerformance).map(d => ({
        department: d.name,
        employeeCount: d.count,
        averageRating: d.count > 0 ? Number((d.totalRating / d.count).toFixed(2)) : 0,
      })).sort((a, b) => b.averageRating - a.averageRating);
      
      // 4. Location Performance Comparison
      const locationPerformance: Record<string, { count: number; totalRating: number; name: string }> = {};
      completedEvaluations.forEach(e => {
        const locId = (e as any).locationId || 'unknown';
        const location = locations.find(l => l.id === locId);
        const locName = location?.name || 'Unknown';
        if (!locationPerformance[locId]) {
          locationPerformance[locId] = { count: 0, totalRating: 0, name: locName };
        }
        locationPerformance[locId].count++;
        locationPerformance[locId].totalRating += (e.overallRating as number) || 0;
      });
      
      const locationStats = Object.values(locationPerformance).map(l => ({
        location: l.name,
        employeeCount: l.count,
        averageRating: l.count > 0 ? Number((l.totalRating / l.count).toFixed(2)) : 0,
      })).sort((a, b) => b.averageRating - a.averageRating);
      
      // 5. Level Performance
      const levelPerformance: Record<string, { count: number; totalRating: number; name: string }> = {};
      completedEvaluations.forEach(e => {
        const levId = (e as any).levelId || 'unknown';
        const level = levels.find(l => l.id === levId);
        const levName = level ? `${level.code} - ${level.description}` : 'Unknown';
        if (!levelPerformance[levId]) {
          levelPerformance[levId] = { count: 0, totalRating: 0, name: levName };
        }
        levelPerformance[levId].count++;
        levelPerformance[levId].totalRating += (e.overallRating as number) || 0;
      });
      
      const levelStats = Object.values(levelPerformance).map(l => ({
        level: l.name,
        employeeCount: l.count,
        averageRating: l.count > 0 ? Number((l.totalRating / l.count).toFixed(2)) : 0,
      })).sort((a, b) => b.averageRating - a.averageRating);
      
      // 6. Grade Performance
      const gradePerformance: Record<string, { count: number; totalRating: number; name: string }> = {};
      completedEvaluations.forEach(e => {
        const grdId = (e as any).gradeId || 'unknown';
        const grade = grades.find(g => g.id === grdId);
        const grdName = grade ? `${grade.code} - ${grade.description}` : 'Unknown';
        if (!gradePerformance[grdId]) {
          gradePerformance[grdId] = { count: 0, totalRating: 0, name: grdName };
        }
        gradePerformance[grdId].count++;
        gradePerformance[grdId].totalRating += (e.overallRating as number) || 0;
      });
      
      const gradeStats = Object.values(gradePerformance).map(g => ({
        grade: g.name,
        employeeCount: g.count,
        averageRating: g.count > 0 ? Number((g.totalRating / g.count).toFixed(2)) : 0,
      })).sort((a, b) => b.averageRating - a.averageRating);
      
      // 7. Summary Statistics
      const allRatings = completedEvaluations.map(e => e.overallRating as number);
      const calibratedRatings = completedEvaluations.filter(e => e.calibratedRating).map(e => e.calibratedRating as number);
      
      const summary = {
        totalEmployees: users.length,
        totalEvaluations: allEvaluations.length,
        completedEvaluations: completedEvaluations.length,
        averageRating: allRatings.length > 0 ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)) : 0,
        averageCalibratedRating: calibratedRatings.length > 0 ? Number((calibratedRatings.reduce((a, b) => a + b, 0) / calibratedRatings.length).toFixed(2)) : 0,
        calibrationRate: completedEvaluations.length > 0 ? Math.round((completedEvaluations.filter(e => e.calibratedRating).length / completedEvaluations.length) * 100) : 0,
        meetingsCompletedRate: completedEvaluations.length > 0 ? Math.round((completedEvaluations.filter(e => e.meetingCompletedAt).length / completedEvaluations.length) * 100) : 0,
        topPerformers: completedEvaluations.filter(e => e.overallRating === 5).length,
        needsImprovement: completedEvaluations.filter(e => e.overallRating !== null && e.overallRating <= 2).length,
      };
      
      // 8. Manager Performance (average ratings given by each manager)
      const managerPerformance: Record<string, { count: number; totalRating: number; name: string; id: string }> = {};
      completedEvaluations.forEach(e => {
        const mgrId = e.managerId || 'unknown';
        const manager = users.find(u => u.id === mgrId);
        const mgrName = manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown';
        if (!managerPerformance[mgrId]) {
          managerPerformance[mgrId] = { count: 0, totalRating: 0, name: mgrName, id: mgrId };
        }
        managerPerformance[mgrId].count++;
        managerPerformance[mgrId].totalRating += (e.overallRating as number) || 0;
      });
      
      const managerStats = Object.values(managerPerformance).map(m => ({
        managerId: m.id,
        managerName: m.name,
        teamSize: m.count,
        averageRatingGiven: m.count > 0 ? Number((m.totalRating / m.count).toFixed(2)) : 0,
      })).filter(m => m.managerName !== 'Unknown').sort((a, b) => b.teamSize - a.teamSize);
      
      return {
        summary,
        ratingDistribution,
        cyclePerformance,
        departmentStats,
        locationStats,
        levelStats,
        gradeStats,
        managerStats,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get performance trends', { requestingUserId, error });
      throw new AppError('Failed to retrieve performance trends', 500);
    }
  }
}
