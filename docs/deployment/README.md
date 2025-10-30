# Deployment Documentation

## Overview

This directory contains deployment scripts and documentation for Emmy's Learning Adventure. The deployment process includes automated testing, performance validation, backup creation, and rollback procedures.

## Files

- `deploy.sh` - Main deployment script with performance monitoring
- `rollback.sh` - Rollback script for emergency recovery
- `README.md` - This documentation file

## Prerequisites

### System Requirements
- Node.js 18.0.0 or higher
- npm (comes with Node.js)
- git
- bash shell
- Lighthouse CLI (optional, for performance validation)

### Installation
```bash
# Install Node.js and npm (if not already installed)
# On macOS with Homebrew:
brew install node

# On Ubuntu/Debian:
sudo apt update
sudo apt install nodejs npm

# Install Lighthouse CLI (optional)
npm install -g lighthouse
```

## Deployment Process

### 1. Automated Deployment

Run the main deployment script:

```bash
# Make script executable (first time only)
chmod +x docs/deployment/deploy.sh

# Run deployment
./docs/deployment/deploy.sh
```

The deployment script will:
1. Run pre-deployment checks
2. Install dependencies
3. Run test suite
4. Build application
5. Validate performance
6. Create backup
7. Deploy to production
8. Run post-deployment validation
9. Setup monitoring

### 2. Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm run test -- --run
npm run test:a11y

# 3. Build application
npm run build

# 4. Deploy build files
cp -r dist/* /path/to/production/

# 5. Update service worker cache
# Edit sw.js to update CACHE_VERSION
```

## Performance Monitoring

### Automated Checks

The deployment script automatically:
- Measures Core Web Vitals (LCP, FID, CLS)
- Validates performance thresholds
- Generates Lighthouse reports
- Monitors bundle size

### Performance Thresholds

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Manual Performance Testing

```bash
# Run Lighthouse audit
lighthouse http://localhost:3000 --output=json --output-path=report.json

# Analyze bundle size
npm run analyze

# Test Core Web Vitals
npm run test:performance
```

## Backup and Rollback

### Automatic Backups

The deployment script automatically creates backups before each deployment:
- Stored in `backups/` directory
- Named with timestamp: `emmys-learning-app_backup_YYYYMMDD_HHMMSS`
- Keeps last 5 backups automatically

### Manual Backup

```bash
# Create manual backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r current_deployment backups/manual_backup_$TIMESTAMP
```

### Rollback Procedures

#### Quick Rollback (Latest Backup)
```bash
./docs/deployment/rollback.sh quick
```

#### Interactive Rollback
```bash
./docs/deployment/rollback.sh
# Follow prompts to select backup
```

#### Rollback to Specific Backup
```bash
./docs/deployment/rollback.sh to emmys-learning-app_backup_20241029_143022
```

#### List Available Backups
```bash
./docs/deployment/rollback.sh list
```

#### Check Deployment Status
```bash
./docs/deployment/rollback.sh status
```

## Troubleshooting

### Common Issues

#### Deployment Fails at Build Step
```bash
# Check Node.js version
node --version  # Should be 18.0.0+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building manually
npm run build
```

#### Performance Tests Fail
```bash
# Check if Lighthouse is installed
lighthouse --version

# Install if missing
npm install -g lighthouse

# Run performance tests manually
npm run test:performance
```

#### Tests Fail
```bash
# Run tests with verbose output
npm run test -- --run --reporter=verbose

# Run specific test suite
npm run test:a11y
npm run test:unit
```

#### Rollback Issues
```bash
# Check backup directory
ls -la backups/

# Validate backup manually
./docs/deployment/rollback.sh status

# Force rollback to latest
./docs/deployment/rollback.sh quick
```

### Error Recovery

#### If Deployment Partially Completes
1. Check the deployment log file
2. Identify the failed step
3. Fix the issue
4. Re-run deployment script
5. If issues persist, rollback and investigate

#### If App Won't Start After Deployment
1. Check for JavaScript errors in browser console
2. Verify all files were copied correctly
3. Check service worker registration
4. Clear browser cache
5. Rollback if necessary

#### If Performance Degrades
1. Check Lighthouse report for issues
2. Analyze bundle size changes
3. Review recent code changes
4. Consider rolling back
5. Optimize and redeploy

## Monitoring and Maintenance

### Post-Deployment Checklist

After each deployment:
- [ ] Verify app loads correctly
- [ ] Test core functionality
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Validate accessibility features
- [ ] Test offline functionality
- [ ] Verify PWA features work

### Regular Maintenance

#### Weekly
- Review performance metrics
- Check error logs
- Update dependencies (security patches)
- Monitor user feedback

#### Monthly
- Full performance audit
- Accessibility compliance check
- Security vulnerability scan
- Backup cleanup (remove old backups)

#### Quarterly
- Major dependency updates
- Performance optimization review
- User experience analysis
- Infrastructure review

### Monitoring Tools

#### Built-in Monitoring
- Performance monitoring in app
- Error reporting system
- User analytics
- Core Web Vitals tracking

#### External Tools
- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI
- Browser DevTools

## Security Considerations

### Deployment Security
- Scripts validate file integrity
- Backups are created before changes
- Rollback procedures are tested
- Access logs are maintained

### Application Security
- Dependencies are audited for vulnerabilities
- Content Security Policy is implemented
- HTTPS is enforced
- User data is protected

### Best Practices
- Keep deployment scripts in version control
- Test rollback procedures regularly
- Monitor for security vulnerabilities
- Update dependencies regularly
- Use secure deployment environments

## Environment Configuration

### Development
```bash
NODE_ENV=development npm run dev
```

### Staging
```bash
NODE_ENV=staging npm run build
```

### Production
```bash
NODE_ENV=production npm run build
```

### Environment Variables
- `NODE_ENV` - Environment mode
- `VITE_APP_VERSION` - App version
- `VITE_BUILD_TIME` - Build timestamp

## Support and Documentation

### Getting Help
- Check this documentation first
- Review deployment logs
- Check application error logs
- Consult technical documentation
- Contact development team

### Documentation Links
- [User Guide](../USER_GUIDE.md)
- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
- [Accessibility Compliance](../ACCESSIBILITY_COMPLIANCE.md)

### Emergency Contacts
- Development Team: [Contact Information]
- System Administrator: [Contact Information]
- Emergency Hotline: [Contact Information]

---

*This deployment documentation is maintained alongside the application code. Please keep it updated with any changes to the deployment process.*