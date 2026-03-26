-- Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
);

-- Create Notes Table
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    owner_id INT NOT NULL,
    share_id VARCHAR(36) NOT NULL UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_owner (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
);

-- Create Note Shares Table (for private sharing)
CREATE TABLE note_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    shared_with_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY fk_note (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY fk_user (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_note_user (note_id, shared_with_user_id),
    
);
