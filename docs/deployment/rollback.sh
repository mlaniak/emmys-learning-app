#!/bin/bash

# Emmy's Learning Adventure - Production Rollback Script
# This script handles rollback to previous deployment with safety checks

set -e  # Exit on any error

# Configuration
PROJECT_NAME="emmys-learning-app"
BACKUP_DIR="backups"
LOG_FILE="rollback.log"

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

# List available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        ls -la $BACKUP_DIR | grep "^d" | awk '{print $9, $6, $7, $8}' | grep -v "^\.$\|^\.\.$" | sort -r
    else
        warning "No backups found in $BACKUP_DIR"
        return 1
    fi
}

# Validate backup
validate_backup() {
    local backup_path="$1"
    
    if [ ! -d "$backup_path" ]; then
        error "Backup directory does not exist: $backup_path"
    fi
    
    # Check for critical files
    local critical_files=("index.html")
    for file in "${critical_files[@]}"; do
        if [ ! -f "$backup_path/$file" ]; then
            error "Critical file missing in backup: $file"
        fi
    done
    
    # Check backup size (should not be empty)
    local backup_size=$(du -s "$backup_path" | cut -f1)
    if [ "$backup_size" -lt 100 ]; then  # Less than 100KB
        error "Backup appears to be too small or corrupted: ${backup_size}KB"
    fi
    
    success "Backup validation passed: $backup_path"
}

# Create emergency backup of current deployment
create_emergency_backup() {
    log "Creating emergency backup of current deployment..."
    
    if [ ! -d "current_deployment" ]; then
        warning "No current deployment found to backup"
        return 0
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local emergency_backup="$BACKUP_DIR/emergency_backup_${timestamp}"
    
    mkdir -p "$BACKUP_DIR"
    cp -r current_deployment "$emergency_backup"
    
    success "Emergency backup created: $emergency_backup"
}

# Perform rollback
perform_rollback() {
    local backup_path="$1"
    
    log "Starting rollback to: $backup_path"
    
    # Validate the backup first
    validate_backup "$backup_path"
    
    # Create emergency backup of current state
    create_emergency_backup
    
    # Remove current deployment
    if [ -d "current_deployment" ]; then
        rm -rf current_deployment
        log "Removed current deployment"
    fi
    
    # Restore from backup
    cp -r "$backup_path" current_deployment
    log "Restored deployment from backup"
    
    # Set proper permissions
    chmod -R 755 current_deployment
    
    # Update service worker cache version to force refresh
    local cache_version=$(date +%s)
    if [ -f "current_deployment/sw.js" ]; then
        sed -i "s/CACHE_VERSION = '[^']*'/CACHE_VERSION = 'rollback_$cache_version'/g" current_deployment/sw.js 2>/dev/null || true
        log "Updated service worker cache version"
    fi
    
    success "Rollback completed successfully"
}

# Post-rollback validation
post_rollback_validation() {
    log "Running post-rollback validation..."
    
    # Check if deployment directory exists and has content
    if [ ! -d "current_deployment" ] || [ -z "$(ls -A current_deployment)" ]; then
        error "Deployment directory is empty or missing after rollback"
    fi
    
    # Validate critical files exist
    local critical_files=("index.html")
    for file in "${critical_files[@]}"; do
        if [ ! -f "current_deployment/$file" ]; then
            error "Critical file missing after rollback: $file"
        fi
    done
    
    # Check deployment size
    local deployment_size=$(du -sh current_deployment | cut -f1)
    log "Deployment size after rollback: $deployment_size"
    
    success "Post-rollback validation completed"
}

# Health check
perform_health_check() {
    log "Performing health check..."
    
    # Check if we can start a local server for testing
    if command -v python3 >/dev/null 2>&1; then
        log "Starting temporary server for health check..."
        cd current_deployment
        timeout 10s python3 -m http.server 8080 >/dev/null 2>&1 &
        local server_pid=$!
        cd ..
        
        sleep 2
        
        # Try to access the app
        if command -v curl >/dev/null 2>&1; then
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
                success "Health check passed - app is accessible"
            else
                warning "Health check failed - app may not be accessible"
            fi
        else
            log "curl not available, skipping HTTP health check"
        fi
        
        # Clean up test server
        kill $server_pid 2>/dev/null || true
    else
        log "Python3 not available, skipping server health check"
    fi
    
    # Check file integrity
    local file_count=$(find current_deployment -type f | wc -l)
    log "Files in deployment: $file_count"
    
    if [ "$file_count" -lt 5 ]; then
        warning "Deployment has very few files, may be incomplete"
    fi
}

# Interactive backup selection
select_backup_interactive() {
    echo
    echo "=== ROLLBACK BACKUP SELECTION ==="
    
    if ! list_backups; then
        error "No backups available for rollback"
    fi
    
    echo
    echo "Available backups:"
    local backups=($(ls -1 $BACKUP_DIR | grep -E "^${PROJECT_NAME}_backup_|^emergency_backup_" | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        error "No valid backups found"
    fi
    
    local i=1
    for backup in "${backups[@]}"; do
        local backup_date=$(echo "$backup" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
        local formatted_date=$(date -d "${backup_date:0:8} ${backup_date:9:2}:${backup_date:11:2}:${backup_date:13:2}" 2>/dev/null || echo "$backup_date")
        echo "$i) $backup ($formatted_date)"
        ((i++))
    done
    
    echo
    read -p "Select backup number (1-${#backups[@]}): " selection
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
        error "Invalid selection: $selection"
    fi
    
    local selected_backup="${backups[$((selection-1))]}"
    echo "Selected backup: $selected_backup"
    
    # Confirmation
    echo
    warning "This will replace the current deployment with the selected backup."
    read -p "Are you sure you want to proceed? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "Rollback cancelled by user"
        exit 0
    fi
    
    echo "$BACKUP_DIR/$selected_backup"
}

# Quick rollback to latest backup
quick_rollback() {
    log "Performing quick rollback to latest backup..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory does not exist: $BACKUP_DIR"
    fi
    
    # Find latest backup
    local latest_backup=$(ls -1t $BACKUP_DIR | grep -E "^${PROJECT_NAME}_backup_|^emergency_backup_" | head -n1)
    
    if [ -z "$latest_backup" ]; then
        error "No backups found for quick rollback"
    fi
    
    log "Latest backup found: $latest_backup"
    
    # Confirmation for quick rollback
    warning "This will rollback to the latest backup: $latest_backup"
    read -p "Continue with quick rollback? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "Quick rollback cancelled by user"
        exit 0
    fi
    
    perform_rollback "$BACKUP_DIR/$latest_backup"
}

# Rollback to specific backup
rollback_to_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        error "Backup not found: $backup_path"
    fi
    
    log "Rolling back to specific backup: $backup_name"
    perform_rollback "$backup_path"
}

# Show rollback status
show_status() {
    echo
    echo "=== ROLLBACK STATUS ==="
    
    if [ -d "current_deployment" ]; then
        local deployment_size=$(du -sh current_deployment | cut -f1)
        local file_count=$(find current_deployment -type f | wc -l)
        echo "Current deployment: EXISTS"
        echo "Deployment size: $deployment_size"
        echo "File count: $file_count"
        
        if [ -f "current_deployment/index.html" ]; then
            echo "Status: HEALTHY"
        else
            echo "Status: UNHEALTHY (missing critical files)"
        fi
    else
        echo "Current deployment: NOT FOUND"
        echo "Status: NO DEPLOYMENT"
    fi
    
    echo
    echo "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls -1 $BACKUP_DIR 2>/dev/null | wc -l)
        echo "Backup count: $backup_count"
        
        if [ "$backup_count" -gt 0 ]; then
            echo "Latest backup: $(ls -1t $BACKUP_DIR | head -n1)"
        fi
    else
        echo "Backup directory: NOT FOUND"
    fi
}

# Main function
main() {
    local action="${1:-interactive}"
    
    log "Starting rollback process for $PROJECT_NAME"
    log "Action: $action"
    
    case "$action" in
        "interactive"|"")
            local backup_path=$(select_backup_interactive)
            perform_rollback "$backup_path"
            post_rollback_validation
            perform_health_check
            ;;
        "quick")
            quick_rollback
            post_rollback_validation
            perform_health_check
            ;;
        "list")
            list_backups
            ;;
        "status")
            show_status
            ;;
        "to")
            if [ -z "$2" ]; then
                error "Backup name required for 'to' action. Usage: $0 to <backup_name>"
            fi
            rollback_to_backup "$2"
            post_rollback_validation
            perform_health_check
            ;;
        "help")
            echo "Usage: $0 [action] [backup_name]"
            echo
            echo "Actions:"
            echo "  interactive  - Interactive backup selection (default)"
            echo "  quick        - Rollback to latest backup"
            echo "  list         - List available backups"
            echo "  status       - Show current deployment status"
            echo "  to <name>    - Rollback to specific backup"
            echo "  help         - Show this help message"
            echo
            echo "Examples:"
            echo "  $0                                    # Interactive selection"
            echo "  $0 quick                              # Quick rollback to latest"
            echo "  $0 to emmys-learning-app_backup_20241029_143022"
            echo "  $0 list                               # List backups"
            echo "  $0 status                             # Show status"
            exit 0
            ;;
        *)
            error "Unknown action: $action. Use '$0 help' for usage information."
            ;;
    esac
    
    success "Rollback process completed successfully!"
    
    # Display summary
    echo
    echo "=== ROLLBACK SUMMARY ==="
    echo "Project: $PROJECT_NAME"
    echo "Action: $action"
    echo "Rollback Time: $(date)"
    echo "Log File: $LOG_FILE"
    echo
    echo "Next steps:"
    echo "1. Test the application thoroughly"
    echo "2. Monitor for any issues"
    echo "3. Check error logs"
    echo "4. Verify all features work correctly"
    echo "5. Consider investigating the cause of the original issue"
}

# Handle script interruption
trap 'error "Rollback interrupted"' INT TERM

# Run main function with all arguments
main "$@"