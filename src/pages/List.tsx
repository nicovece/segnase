import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useList } from '../hooks/useList';
import { useItems } from '../hooks/useItems';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Item } from '../lib/types';

function ImageModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      className='fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50'
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className='absolute top-4 right-4 text-white hover:text-gray-300 p-2'
      >
        <svg className='w-8 h-8' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
      <img
        src={imageUrl}
        alt='Full size'
        className='max-w-full max-h-full object-contain'
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function EditItemModal({
  item,
  onSave,
  onClose,
  onRemoveImage,
  onUploadImage,
}: {
  item: Item;
  onSave: (updates: {
    name: string;
    quantity: string;
    notes: string;
  }) => Promise<void>;
  onClose: () => void;
  onRemoveImage: () => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClasses =
    'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
  const labelClasses = 'text-sm font-medium text-gray-700 dark:text-gray-300';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    // Handle image changes
    if (item.image_url && !imageUrl && !pendingImage) {
      await onRemoveImage();
    }
    if (pendingImage) {
      await onUploadImage(pendingImage);
    }

    await onSave({
      name: name.trim(),
      quantity: quantity.trim(),
      notes: notes.trim(),
    });
    setSaving(false);
    onClose();
  };

  const displayImage = imagePreview || imageUrl;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
            Edit item
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          >
            <svg className='w-5 h-5' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='edit-name' className={labelClasses}>
              Name
            </label>
            <input
              id='edit-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='edit-quantity' className={labelClasses}>
              Quantity
            </label>
            <input
              id='edit-quantity'
              type='text'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder='e.g., 2 liters'
              className={inputClasses}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='edit-notes' className={labelClasses}>
              Notes
            </label>
            <input
              id='edit-notes'
              type='text'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Image section */}
          <div className='flex flex-col gap-2'>
            <label className={labelClasses}>Photo</label>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              className='hidden'
            />
            {displayImage ? (
              <div className='relative inline-block'>
                <img
                  src={displayImage}
                  alt='Item'
                  className='w-24 h-24 object-cover rounded-lg'
                />
                <button
                  type='button'
                  onClick={handleRemoveImage}
                  className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600'
                >
                  <svg
                    className='w-4 h-4'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                <span className='text-xs mt-1'>Add photo</span>
              </button>
            )}
          </div>

          <div className='flex gap-2 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
  onImageClick,
}: {
  item: Item;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onImageClick: (url: string) => void;
}) {
  return (
    <li
      className={`flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
        item.checked ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          item.checked
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }`}
      >
        {item.checked && (
          <svg
            className='w-3 h-3'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={3}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M5 13l4 4L19 7'
            />
          </svg>
        )}
      </button>

      <div className='flex-1 min-w-0 cursor-pointer' onClick={onEdit}>
        <div className='flex items-baseline gap-2'>
          <span
            className={`font-medium ${
              item.checked
                ? 'line-through text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {item.name}
          </span>
          {item.quantity && (
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {item.quantity}
            </span>
          )}
        </div>
        {item.notes && (
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
            {item.notes}
          </p>
        )}
        {item.image_url && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(item.image_url!);
            }}
            className='mt-2 block'
          >
            <img
              src={item.image_url}
              alt={item.name}
              className='w-16 h-16 object-cover rounded-lg hover:opacity-80'
            />
          </button>
        )}
      </div>

      <button
        onClick={onDelete}
        className='text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 flex-shrink-0'
        title='Delete item'
      >
        <svg className='w-4 h-4' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    </li>
  );
}

function AddItemForm({
  onAdd,
}: {
  onAdd: (
    name: string,
    quantity?: string,
    notes?: string,
    imageFile?: File,
  ) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClasses =
    'flex-1 px-4 py-3 text-xl border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
  const labelClasses =
    'text-sm font-medium text-gray-700 px-4 dark:text-gray-300';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    await onAdd(
      name.trim(),
      quantity.trim() || undefined,
      notes.trim() || undefined,
      imageFile || undefined,
    );
    setName('');
    setQuantity('');
    setNotes('');
    setImageFile(null);
    setImagePreview(null);
    setShowDetails(false);
    setAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className='mb-6'>
      <button
        type='button'
        onClick={() => setShowDetails(!showDetails)}
        className={`px-3 py-3 border rounded-lg flex items-center justify-center gap-2 mb-6 w-full text-xl  ${
          showDetails
            ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            : 'border-blue-700  text-blue-200 bg-blue-900'
        } hover:border-blue-500`}
        title='Add item'
      >
        <svg
          className='w-5 h-5'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
          />
        </svg>
        Add item
      </button>
      {showDetails && (
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='name' className={labelClasses}>
              Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Add item...'
              className={inputClasses}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='quantity' className={labelClasses}>
              Quantity
            </label>
            <input
              id='quantity'
              type='text'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder='Quantity (e.g., 2 liters)'
              className={inputClasses}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='notes' className={labelClasses}>
              Notes
            </label>
            <input
              id='notes'
              type='text'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Notes'
              className={inputClasses}
            />
          </div>

          {/* Image picker */}
          <div className='flex flex-col gap-2'>
            <label className={labelClasses}>Photo</label>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              className='hidden'
            />
            {imagePreview ? (
              <div className='relative inline-block'>
                <img
                  src={imagePreview}
                  alt='Preview'
                  className='w-24 h-24 object-cover rounded-lg'
                />
                <button
                  type='button'
                  onClick={handleRemoveImage}
                  className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600'
                >
                  <svg
                    className='w-4 h-4'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                <span className='text-xs mt-1'>Add photo</span>
              </button>
            )}
          </div>

          <button
            type='submit'
            disabled={adding || !name.trim()}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {adding ? '...' : 'Add'}
          </button>
        </div>
      )}
    </form>
  );
}

export function List() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    list,
    loading: listLoading,
    error: listError,
    archiveList,
    activateList,
    refetch: refetchList,
  } = useList(id!);
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    uploadImage,
    removeImage,
  } = useItems(id!);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loading = listLoading || itemsLoading;
  const error = listError || itemsError;

  const handleAddItem = async (
    name: string,
    quantity?: string,
    notes?: string,
    imageFile?: File,
  ) => {
    await addItem(name, quantity, notes, imageFile);
    // Refetch list to get updated status (in case trigger changed it)
    refetchList();
  };

  const handleEditItem = async (
    itemId: string,
    updates: { name: string; quantity: string; notes: string },
  ) => {
    await updateItem(itemId, {
      name: updates.name,
      quantity: updates.quantity || null,
      notes: updates.notes || null,
    });
    refetchList();
  };

  const handleToggleItem = async (itemId: string) => {
    await toggleItem(itemId);
    // Refetch list to get updated status
    refetchList();
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem(itemId);
    refetchList();
  };

  const handleArchive = async () => {
    await archiveList();
  };

  const handleActivate = async () => {
    await activateList();
  };

  const shareUrl = list
    ? `${window.location.origin}/join/${list.share_token}`
    : '';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user || !list) return;

    setInviting(true);
    setInviteStatus('idle');
    setInviteError(null);

    const { error } = await supabase.from('list_invites').insert({
      list_id: list.id,
      email: inviteEmail.trim().toLowerCase(),
      invited_by: user.id,
    });

    if (error) {
      if (error.code === '23505') {
        setInviteError('This email has already been invited');
      } else {
        setInviteError(error.message);
      }
      setInviteStatus('error');
    } else {
      setInviteStatus('success');
      setInviteEmail('');
      setTimeout(() => setInviteStatus('idle'), 3000);
    }

    setInviting(false);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-gray-500 dark:text-gray-400'>Loading...</div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-4'>
        <div className='max-w-md mx-auto'>
          <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4'>
            {error || 'List not found'}
          </div>
          <Link
            to='/'
            className='text-blue-600 dark:text-blue-400 hover:underline'
          >
            Back to lists
          </Link>
        </div>
      </div>
    );
  }

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3'>
        <div className='max-w-md mx-auto'>
          <div className='flex items-center gap-3'>
            <Link
              to='/'
              className='text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </Link>
            <div className='flex-1'>
              <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                {list.name}
              </h1>
              {list.notes && (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {list.notes}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className='p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              title='Share list'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                />
              </svg>
            </button>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                list.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : list.status === 'archived'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}
            >
              {list.status}
            </span>
          </div>
        </div>
      </header>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <ImageModal
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updates) => handleEditItem(editingItem.id, updates)}
          onRemoveImage={() => removeImage(editingItem.id)}
          onUploadImage={(file) => uploadImage(editingItem.id, file)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                Share list
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                <svg
                  className='w-5 h-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>

            {/* Share link section */}
            <div className='mb-6'>
              <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Share link
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Anyone with this link can join and edit this list.
              </p>
              <div className='flex gap-2'>
                <input
                  type='text'
                  readOnly
                  value={shareUrl}
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300'
                />
                <button
                  onClick={handleCopyLink}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm'
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Email invite section */}
            <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
              <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Invite by email
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                They'll get access when they sign in with this email.
              </p>
              <form onSubmit={handleInvite} className='flex gap-2'>
                <input
                  type='email'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder='email@example.com'
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
                <button
                  type='submit'
                  disabled={inviting || !inviteEmail.trim()}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {inviting ? '...' : 'Invite'}
                </button>
              </form>
              {inviteStatus === 'success' && (
                <p className='text-xs text-green-600 dark:text-green-400 mt-2'>
                  Invite sent!
                </p>
              )}
              {inviteStatus === 'error' && (
                <p className='text-xs text-red-600 dark:text-red-400 mt-2'>
                  {inviteError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className='max-w-md mx-auto p-4'>
        {/* Status actions */}
        {list.status === 'archived' ? (
          <div className='mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              This list is archived
            </span>
            <button
              onClick={handleActivate}
              className='text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium'
            >
              Restore
            </button>
          </div>
        ) : (
          <div className='mb-4 flex justify-end'>
            <button
              onClick={handleArchive}
              className='text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            >
              Archive list
            </button>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
            No items yet. Add your first item above.
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Unchecked items */}
            {uncheckedItems.length > 0 && (
              <ul className='space-y-2'>
                {uncheckedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleItem(item.id)}
                    onDelete={() => handleDeleteItem(item.id)}
                    onEdit={() => setEditingItem(item)}
                    onImageClick={(url) => setFullscreenImage(url)}
                  />
                ))}
              </ul>
            )}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                  Checked ({checkedItems.length})
                </h3>
                <ul className='space-y-2'>
                  {checkedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      onDelete={() => handleDeleteItem(item.id)}
                      onEdit={() => setEditingItem(item)}
                      onImageClick={(url) => setFullscreenImage(url)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
      <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4'>
        {/* Add item form - only show if not archived */}
        {list.status !== 'archived' && <AddItemForm onAdd={handleAddItem} />}
      </div>
    </div>
  );
}
