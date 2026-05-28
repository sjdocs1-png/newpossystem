/**
 * ============================================================================
 * SUPABASE AUTH USER MIGRATION SCRIPT
 * Migrates users from Lovable to Personal Supabase
 * 
 * CRITICAL: This script handles the most sensitive part of migration - auth users
 * 
 * Three strategies available:
 * 1. Email Magic Link (users verify ownership)
 * 2. Temporary Password (users reset on first login)
 * 3. Manual Reset (users contact support)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface MigrationConfig {
  lovableUrl: string;
  lovableServiceKey: string;
  personalUrl: string;
  personalServiceKey: string;
  strategy: 'magic-link' | 'temp-password' | 'manual';
  batchSize: number;
  delayMs: number;
}

interface UserRecord {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  raw_user_meta_data?: Record<string, any>;
  created_at: string;
  email_confirmed_at?: string | null;
}

interface MigrationResult {
  success: boolean;
  userId?: string;
  email: string;
  strategy: string;
  error?: string;
}

// ============================================================================
// LOGGER
// ============================================================================

class Logger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor(filename: string = 'auth_migration.log') {
    this.logFile = filename;
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
  }

  log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    this.logStream.write(logMessage + '\n');
  }

  info(msg: string) { this.log(msg, 'INFO'); }
  warn(msg: string) { this.log(msg, 'WARN'); }
  error(msg: string) { this.log(msg, 'ERROR'); }
  success(msg: string) { this.log(msg, 'SUCCESS'); }

  close() {
    this.logStream.end();
  }
}

// ============================================================================
// QUESTION HELPER
// ============================================================================

function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateTemporaryPassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// AUTH MIGRATION
// ============================================================================

class AuthMigration {
  private lovableAdmin: any;
  private personalAdmin: any;
  private config: MigrationConfig;
  private logger: Logger;
  private results: MigrationResult[] = [];

  constructor(config: MigrationConfig) {
    this.config = config;
    this.logger = new Logger('auth_migration.log');

    this.lovableAdmin = createClient(config.lovableUrl, config.lovableServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.personalAdmin = createClient(config.personalUrl, config.personalServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Fetch all users from Lovable Supabase
   */
  async fetchLovableUsers(): Promise<UserRecord[]> {
    this.logger.info('Fetching users from Lovable Supabase...');

    try {
      const { data: users, error } = await this.lovableAdmin.auth.admin.listUsers();

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      this.logger.success(`Fetched ${users.length} users from Lovable`);
      return users;
    } catch (error: any) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create user using magic link strategy (user must verify)
   */
  async createUserWithMagicLink(user: UserRecord): Promise<MigrationResult> {
    try {
      // In Supabase, magic links are sent automatically when using passwordless auth
      // However, we need to create the user first with a temporary password
      // then user will use "Forgot Password" to set their own password

      const tempPassword = generateTemporaryPassword();

      const { data, error } = await this.personalAdmin.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: false, // User must verify email
        user_metadata: user.user_metadata || {},
        raw_user_meta_data: user.raw_user_meta_data || {},
      });

      if (error) {
        return {
          success: false,
          email: user.email,
          strategy: 'magic-link',
          error: error.message,
        };
      }

      // Send verification email (via email function)
      const { error: inviteError } = await this.personalAdmin.auth.admin.inviteUserByEmail(user.email, {
        redirectTo: 'https://app.paystore.local/verify-email', // Adjust URL
      });

      if (inviteError) {
        this.logger.warn(`Could not send verification email to ${user.email}: ${inviteError.message}`);
      }

      return {
        success: true,
        userId: data.user.id,
        email: user.email,
        strategy: 'magic-link',
      };
    } catch (error: any) {
      return {
        success: false,
        email: user.email,
        strategy: 'magic-link',
        error: error.message,
      };
    }
  }

  /**
   * Create user using temporary password strategy
   * User must change password on first login
   */
  async createUserWithTempPassword(user: UserRecord): Promise<MigrationResult> {
    try {
      const tempPassword = generateTemporaryPassword();

      const { data, error } = await this.personalAdmin.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true, // Skip email verification for speed
        user_metadata: {
          ...user.user_metadata,
          _temp_password_migration: true,
          _migration_date: new Date().toISOString(),
        },
        raw_user_meta_data: user.raw_user_meta_data || {},
      });

      if (error) {
        return {
          success: false,
          email: user.email,
          strategy: 'temp-password',
          error: error.message,
        };
      }

      this.logger.info(`User created: ${user.email} (ID: ${data.user.id})`);

      return {
        success: true,
        userId: data.user.id,
        email: user.email,
        strategy: 'temp-password',
      };
    } catch (error: any) {
      return {
        success: false,
        email: user.email,
        strategy: 'temp-password',
        error: error.message,
      };
    }
  }

  /**
   * Create user with manual strategy
   * User receives instruction to contact support
   */
  async createUserWithManual(user: UserRecord): Promise<MigrationResult> {
    try {
      // Create inactive user account
      const { data, error } = await this.personalAdmin.auth.admin.createUser({
        email: user.email,
        password: generateTemporaryPassword(), // Generate but don't use
        email_confirm: false,
        user_metadata: {
          ...user.user_metadata,
          _manual_password_reset_required: true,
          _migration_date: new Date().toISOString(),
          _original_created_at: user.created_at,
        },
      });

      if (error) {
        return {
          success: false,
          email: user.email,
          strategy: 'manual',
          error: error.message,
        };
      }

      this.logger.info(`User created (manual reset): ${user.email}`);

      return {
        success: true,
        userId: data.user.id,
        email: user.email,
        strategy: 'manual',
      };
    } catch (error: any) {
      return {
        success: false,
        email: user.email,
        strategy: 'manual',
        error: error.message,
      };
    }
  }

  /**
   * Migrate user based on configured strategy
   */
  async migrateUser(user: UserRecord): Promise<MigrationResult> {
    try {
      let result: MigrationResult;

      switch (this.config.strategy) {
        case 'magic-link':
          result = await this.createUserWithMagicLink(user);
          break;
        case 'temp-password':
          result = await this.createUserWithTempPassword(user);
          break;
        case 'manual':
          result = await this.createUserWithManual(user);
          break;
        default:
          result = {
            success: false,
            email: user.email,
            strategy: this.config.strategy,
            error: `Unknown strategy: ${this.config.strategy}`,
          };
      }

      this.results.push(result);

      if (result.success) {
        this.logger.success(`✓ Migrated: ${user.email}`);
      } else {
        this.logger.error(`✗ Failed: ${user.email} - ${result.error}`);
      }

      return result;
    } catch (error: any) {
      const result = {
        success: false,
        email: user.email,
        strategy: this.config.strategy,
        error: error.message,
      };
      this.results.push(result);
      this.logger.error(`✗ Exception: ${user.email} - ${error.message}`);
      return result;
    }
  }

  /**
   * Migrate all users in batches
   */
  async migrateAllUsers(users: UserRecord[]): Promise<void> {
    this.logger.info(`Starting migration of ${users.length} users using ${this.config.strategy} strategy`);
    this.logger.info(`Batch size: ${this.config.batchSize}, Delay: ${this.config.delayMs}ms`);

    for (let i = 0; i < users.length; i += this.config.batchSize) {
      const batch = users.slice(i, i + this.config.batchSize);
      this.logger.info(`Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(users.length / this.config.batchSize)}`);

      for (const user of batch) {
        await this.migrateUser(user);
        await sleep(this.config.delayMs); // Rate limiting
      }

      if (i + this.config.batchSize < users.length) {
        this.logger.info('Waiting between batches...');
        await sleep(1000);
      }
    }
  }

  /**
   * Create user_roles entries for all migrated users
   */
  async migrateUserRoles(users: UserRecord[]): Promise<void> {
    this.logger.info('Creating user_roles entries...');

    for (const result of this.results) {
      if (result.success && result.userId) {
        try {
          const { error } = await this.personalAdmin
            .from('user_roles')
            .insert({
              id: crypto.randomUUID(),
              user_id: result.userId,
              role: 'staff', // Default role - adjust as needed
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            this.logger.warn(`Failed to create user_role for ${result.email}: ${error.message}`);
          }
        } catch (error: any) {
          this.logger.warn(`Exception creating user_role for ${result.email}: ${error.message}`);
        }
      }
    }

    this.logger.success('User roles created');
  }

  /**
   * Generate summary report
   */
  generateReport(): void {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    const reportFile = `auth_migration_report_${new Date().toISOString().split('T')[0]}.txt`;
    let reportContent = `SUPABASE AUTH MIGRATION REPORT\n`;
    reportContent += `Generated: ${new Date().toISOString()}\n`;
    reportContent += `Strategy: ${this.config.strategy}\n\n`;

    reportContent += `SUMMARY:\n`;
    reportContent += `Total Users: ${this.results.length}\n`;
    reportContent += `Successful: ${successful}\n`;
    reportContent += `Failed: ${failed}\n`;
    reportContent += `Success Rate: ${((successful / this.results.length) * 100).toFixed(2)}%\n\n`;

    reportContent += `SUCCESSFUL MIGRATIONS:\n`;
    this.results
      .filter(r => r.success)
      .forEach(r => {
        reportContent += `  ✓ ${r.email} (ID: ${r.userId})\n`;
      });

    if (failed > 0) {
      reportContent += `\nFAILED MIGRATIONS:\n`;
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          reportContent += `  ✗ ${r.email} - ${r.error}\n`;
        });
    }

    fs.writeFileSync(reportFile, reportContent);
    this.logger.success(`Report generated: ${reportFile}`);
  }

  /**
   * Run complete migration
   */
  async run(): Promise<void> {
    try {
      const lovableUsers = await this.fetchLovableUsers();

      if (lovableUsers.length === 0) {
        this.logger.warn('No users found to migrate');
        return;
      }

      // Show preview
      this.logger.info(`\nFirst 5 users to migrate:`);
      lovableUsers.slice(0, 5).forEach(u => {
        this.logger.info(`  - ${u.email}`);
      });

      const confirm = await question('\nProceed with migration? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        this.logger.warn('Migration cancelled by user');
        return;
      }

      await this.migrateAllUsers(lovableUsers);
      await this.migrateUserRoles(lovableUsers);
      this.generateReport();

      this.logger.success('Auth migration complete!');
    } catch (error: any) {
      this.logger.error(`Migration failed: ${error.message}`);
      throw error;
    } finally {
      this.logger.close();
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================');
  console.log('SUPABASE AUTH USER MIGRATION');
  console.log('================================================\n');

  // Get configuration
  const lovableUrl = await question('Lovable Supabase URL: ');
  const lovableServiceKey = await question('Lovable Service Role Key: ');
  const personalUrl = await question('Personal Supabase URL: ');
  const personalServiceKey = await question('Personal Service Role Key: ');

  console.log('\nMigration Strategies:');
  console.log('1. magic-link   - Users verify email (recommended for small teams)');
  console.log('2. temp-password - Users auto-login with temporary password');
  console.log('3. manual       - Users contact support for password reset');

  const strategy = await question('\nSelect strategy (1-3): ') as any;
  const strategyMap: Record<string, 'magic-link' | 'temp-password' | 'manual'> = {
    '1': 'magic-link',
    '2': 'temp-password',
    '3': 'manual',
  };

  const config: MigrationConfig = {
    lovableUrl,
    lovableServiceKey,
    personalUrl,
    personalServiceKey,
    strategy: strategyMap[strategy] || 'temp-password',
    batchSize: 5,
    delayMs: 100,
  };

  const migration = new AuthMigration(config);
  await migration.run();
}

// Run migration
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
