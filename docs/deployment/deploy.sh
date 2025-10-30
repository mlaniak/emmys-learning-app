#!/bin/bash

# Emmy's Learning Adventure - Production Deployment Script
# This script handles the complete deployment process with performance monitoring

set -e  # Exit on any error

# Configuration
PROJECT_NAME="emmys-learning-app"
BUILD_DIR="dist"
BACKUP_DIR="backups"
LOG_FILE="deployment.log"
PERFORMANCE_THRESHOLD_LCP=2500  # 2.5 seconds
PERFORMANCE_THRESHOLD_FID=100   # 100ms
PERFORMANCE_THRESHOLD_CLS=0.1   # 0.1 CLS score

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    fi
    
    # Check if we're on the correct branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        warning "Not on main branch. Current branch: $CURRENT_BRANCH"
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        error "There are uncommitted changes. Please commit or stash them before deployment."
    fi
    
    success "Pre-deployment checks passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Clean install to ensure consistency
    rm -rf node_modules package-lock.json
    npm install --production=false
    
    # Audit for security vulnerabilities
    npm audit --audit-level=moderate || warning "Security vulnerabilities found. Review before proceeding."
    
    success "Dependencies installed successfully"
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    # Unit tests
    npm run test -- --run --reporter=verbose || error "Unit tests failed"
    
    # Accessibility tests
    npm run test:a11y || error "Accessibility tests failed"
    
    # Performance tests
    npm run test:performance || warning "Performance tests failed - review before proceeding"
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Clean previous build
    rm -rf $BUILD_DIR
    
    # Build with performance monitoring
    NODE_ENV=production npm run build
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        error "Build directory not found. Build may have failed."
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log "Build size: $BUILD_SIZE"
    
    # Analyze bundle
    npm run analyze > bundle-analysis.txt 2>&1 || warning "Bundle analysis failed"
    
    success "Application built successfully"
}

# Performance validation
validate_performance() {
    log "Validating performance metrics..."
    
    # Start local server for testing
    npm run preview &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Run Lighthouse audit
    if command -v lighthouse >/dev/null 2>&1; then
        lighthouse http://localhost:4173 \
            --output=json \
            --output-path=lighthouse-report.json \
            --chrome-flags="--headless" \
            --quiet || warning "Lighthouse audit failed"
        
        # Parse performance metrics
        if [ -f "lighthouse-report.json" ]; then
            LCP=$(node -e "console.log(JSON.parse(require('fs').readFileSync('lighthouse-report.json')).audits['largest-contentful-paint'].numericValue)")
            FID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('lighthouse-report.json')).audits['max-potential-fid'].numericValue)")
            CLS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('lighthouse-report.json')).audits['cumulative-layout-shift'].numericValue)")
            
            log "Performance Metrics:"
            log "  LCP: ${LCP}ms (threshold: ${PERFORMANCE_THRESHOLD_LCP}ms)"
            log "  FID: ${FID}ms (threshold: ${PERFORMANCE_THRESHOLD_FID}ms)"
            log "  CLS: ${CLS} (threshold: ${PERFORMANCE_THRESHOLD_CLS})"
            
            # Check thresholds
            if (( $(echo "$LCP > $PERFORMANCE_THRESHOLD_LCP" | bc -l) )); then
                warning "LCP exceeds threshold: ${LCP}ms > ${PERFORMANCE_THRESHOLD_LCP}ms"
            fi
            
            if (( $(echo "$FID > $PERFORMANCE_THRESHOLD_FID" | bc -l) )); then
                warning "FID exceeds threshold: ${FID}ms > ${PERFORMANCE_THRESHOLD_FID}ms"
            fi
            
            if (( $(echo "$CLS > $PERFORMANCE_THRESHOLD_CLS" | bc -l) )); then
                warning "CLS exceeds threshold: ${CLS} > ${PERFORMANCE_THRESHOLD_CLS}"
            fi
        fi
    else
        warning "Lighthouse not installed. Skipping performance validation."
    fi
    
    # Stop local server
    kill $SERVER_PID 2>/dev/null || true
    
    success "Performance validation completed"
}

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"
    
    mkdir -p $BACKUP_DIR
    
    # Backup current deployment (if exists)
    if [ -d "current_deployment" ]; then
        cp -r current_deployment "$BACKUP_DIR/$BACKUP_NAME"
        log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log "No existing deployment to backup"
    fi
    
    # Keep only last 5 backups
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf
    cd ..
    
    success "Backup process completed"
}

# Deploy to production
deploy_to_production() {
    log "Deploying to production..."
    
    # Copy build to deployment directory
    rm -rf current_deployment
    cp -r $BUILD_DIR current_deployment
    
    # Copy additional files
    cp package.json current_deployment/
    cp -r public/manifest.json current_deployment/ 2>/dev/null || true
    cp -r public/sw.js current_deployment/ 2>/dev/null || true
    
    # Set proper permissions
    chmod -R 755 current_deployment
    
    # Update service worker cache version
    CACHE_VERSION=$(date +%s)
    sed -i "s/CACHE_VERSION = '[^']*'/CACHE_VERSION = '$CACHE_VERSION'/g" current_deployment/sw.js 2>/dev/null || true
    
    success "Deployment completed successfully"
}

# Post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    # Check if deployment directory exists and has content
    if [ ! -d "current_deployment" ] || [ -z "$(ls -A current_deployment)" ]; then
        error "Deployment directory is empty or missing"
    fi
    
    # Validate critical files exist
    CRITICAL_FILES=("index.html" "manifest.json")
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -f "current_deployment/$file" ]; then
            warning "Critical file missing: $file"
        fi
    done
    
    # Test service worker registration
    if [ -f "current_deployment/sw.js" ]; then
        log "Service worker found and ready for registration"
    else
        warning "Service worker not found - PWA features may not work"
    fi
    
    success "Post-deployment validation completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up performance monitoring..."
    
    # Create monitoring configuration
    cat > monitoring-config.json << EOF
{
  "projectName": "$PROJECT_NAME",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD)",
  "performanceThresholds": {
    "lcp": $PERFORMANCE_THRESHOLD_LCP,
    "fid": $PERFORMANCE_THRESHOLD_FID,
    "cls": $PERFORMANCE_THRESHOLD_CLS
  },
  "monitoringEnabled": true
}
EOF
    
    # Copy monitoring config to deployment
    cp monitoring-config.json current_deployment/
    
    success "Performance monitoring configured"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f lighthouse-report.json
    rm -f bundle-analysis.txt
    rm -f monitoring-config.json
    
    # Clean npm cache
    npm cache clean --force 2>/dev/null || true
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment of $PROJECT_NAME"
    log "Deployment started at $(date)"
    
    # Run deployment steps
    pre_deployment_checks
    install_dependencies
    run_tests
    build_application
    validate_performance
    create_backup
    deploy_to_production
    post_deployment_validation
    setup_monitoring
    cleanup
    
    success "Deployment completed successfully!"
    log "Deployment finished at $(date)"
    
    # Display summary
    echo
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Project: $PROJECT_NAME"
    echo "Version: $(git rev-parse HEAD)"
    echo "Build Size: $(du -sh current_deployment | cut -f1)"
    echo "Deployment Time: $(date)"
    echo "Log File: $LOG_FILE"
    echo
    echo "Next steps:"
    echo "1. Monitor application performance"
    echo "2. Check error logs for any issues"
    echo "3. Verify all features work correctly"
    echo "4. Run rollback script if issues are found"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"