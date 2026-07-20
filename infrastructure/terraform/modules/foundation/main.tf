resource "aws_kms_key" "application" { description = "Autoserve ${var.environment} application key"; enable_key_rotation = true }
resource "aws_secretsmanager_secret" "application" { name = "autoserve/${var.environment}/application"; kms_key_id = aws_kms_key.application.arn }
resource "aws_s3_bucket" "private" { bucket_prefix = "autoserve-${var.environment}-private-"; force_destroy = false }
resource "aws_s3_bucket_public_access_block" "private" { bucket = aws_s3_bucket.private.id; block_public_acls = true; block_public_policy = true; ignore_public_acls = true; restrict_public_buckets = true }
resource "aws_s3_bucket_server_side_encryption_configuration" "private" { bucket = aws_s3_bucket.private.id; rule { apply_server_side_encryption_by_default { kms_master_key_id = aws_kms_key.application.arn; sse_algorithm = "aws:kms" } } }
resource "aws_cloudwatch_log_group" "application" { name = "/autoserve/${var.environment}/application"; retention_in_days = 35; kms_key_id = aws_kms_key.application.arn }
